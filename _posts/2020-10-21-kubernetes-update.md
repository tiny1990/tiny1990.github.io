> 本文概述 跨版本升级涉及kubelet 的修改，也是升级流程中一个重要环节。
> 阅读本文需要:
> - 了解kubernetes，以及各个组件的功能
> - golang语言
> - 了解go-spew


# 为什么要升级版本
集群主要版本是<=1.12 落后于社区版本太多(升级时，最新1.17已经release)，kubernetes社区更新迭代速度较快，跟进社区高版本，可以保证集群更可靠稳定,跟上社区的发展利大于弊。
- 新版本 bug fix
- 新feature的应用


# 升级难点

生产集群的升级，不能影响业务容器的运行，k8s组件较多，升级过程中，任何一个组件出现问题，都可能影响到业务，对于核心业务，如果批量重启，可能造成灾难，因此，
集群的升级需要，业务容器无感知，基于社区的升级方案主要有几个问题:
- 版本的升级，不能跨大版本，只能从小版本逐步升级，升级繁琐
- 升级过程中，出现问题，不能回滚
- 升级会造成容器重建，影响业务的运行



## 难点分析
跨版本升级其中一个最大的问题是kubelet会重建业务容器，我们源码分析，为什么升级kubelet，会造成容器重建

### kubelet 是如何同步pod的
kubelet整个处理流程比较复杂，核心处理逻辑在 `kuberuntime_manager.go` 中 `SyncPod` 方法，kubelet会定时或者有event变更调用该方法
```go
// SyncPod syncs the running pod into the desired pod by executing following steps:
//
//  1. Compute sandbox and container changes.
// ...
func (m *kubeGenericRuntimeManager) SyncPod(pod *v1.Pod, podStatus *kubecontainer.PodStatus, pullSecrets []v1.Secret, backOff *flowcontrol.Backoff) (result kubecontainer.PodSyncResult) {
	// Step 1: Compute sandbox and container changes.
	podContainerChanges := m.computePodActions(pod, podStatus)
    ...
```

我们重点关注Step.1 ```computePodActions```，该方法判断容器是否发生了改变，方法逻辑判断比较多，通过分析，我们直接跳到问题代码
```go
	if _, _, changed := containerChanged(&container, containerStatus); changed {
		message = fmt.Sprintf("Container %s definition changed", container.Name)
    ...
```
替换kubelet 二进制后，日志打印  `Container %s definition changed`，看来`containerChanged` 问题出在这里的`HashContainer`，我们对比下1.12 1.17 版本差异


v1.12
```go
func HashContainer(container *v1.Container) uint64 {
	hash := fnv.New32a()
	hashutil.DeepHashObject(hash, *container)
	return uint64(hash.Sum32())
}
```

v1.17
```go
func HashContainer(container *v1.Container) uint64 {
	hash := fnv.New32a()
	containerJson, _ := json.Marshal(container)
	hashutil.DeepHashObject(hash, containerJson)
	return uint64(hash.Sum32())
}
```


对比我们发现，1.12 版本的计算hash方法和1.17发生了改变，一个是通过struct ，一个是直接json string 计算hash，所以node容器hash和计算出来的hash不匹配导致容器重建

## 几种升级方式
最终我们找到了，跨版本升级造成容器重建的原因，通过上面分析，我们总结出几种跨版本升级的方案

- 替换二进制升级
直接将kubelet 二进制换成1.17版本，相对简单粗暴，会造成容器hash比对失败，业务容器重建

- 修改容器hash升级
将k8s组件暂停，升级kubelet之前，更新每个node 容器的hash，再升级kubelet二进制到新版


以上两种方案都不太能满足我们内部平滑升级策略
- 第一种方案 完全不考虑，集群升级会造成业务容器重启，业务方无法接受
- 第二种方案 暂且可以接受，不过升级流程繁琐，需要保证每个环节原子性，且不可回滚


### 探索新的升级方式
既然我们知道了1.12 的hash计算方式，那么我们是否可以 增强hash对比逻辑呢。

##### 增加二次判断
```go
func containerChanged(container *v1.Container, containerStatus *kubecontainer.ContainerStatus) (uint64, uint64, bool) {
	expectedHash := kubecontainer.HashContainer(container)
    if containerStatus.Hash != expectedHash // and more {
		expectedHash = kubecontainer.HashContainerWith12Version(container, false)       // 如果不等 进行1.12 计算hash方法比较
		if containerStatus.Hash == expectedHash {
			return expectedHash, containerStatus.Hash, containerStatus.Hash != expectedHash
		}
    }
    ...

```
找到方案了，我们验证下自己结论，很遗憾，用了1.12 的计算方法，hash没有匹配上

##### go-spew !
容器hash是通过go-spew (不了解的同学可以了解下该项目)计算而来，我们先看下这个module，看下go-spew 怎么hash的。
最终计算逻辑在format 中
```go
func (f *formatState) format(v reflect.Value) {
    ...
	case reflect.Struct:
		numFields := v.NumField()
    ...

```
既然是反射拿到每个字段，value又没变化，那么可以确定是pod 的struct 发生了变化

##### 适配它
最终我们对比v1.12 v1.17 pod strcut 发现  v1.17增加了几个字段
```go
	"SubPathExpr",
	"StartupProbe",
	"WindowsOptions",
```
只要spew计算时，忽略这三个字段就ok，最终，我们给spew扩展了一个方法， 支持忽略指定字段计算hash，k8s适配代码
```go
func DeepHashObjectWithIgnore(hasher hash.Hash, ignoreMap map[string]bool,objectToWrite interface{}) {
	hasher.Reset()
	printer := spew.ConfigState{
		Indent:         " ",
		SortKeys:       true,
		DisableMethods: true,
		SpewKeys:       true,
	}
	printer.FprintfWithIgnoreFields(hasher, "%#v", ignoreMap, objectToWrite)
}
```


## 再升级
细心的同学可能觉察到，修改源码，下一个版本升级，岂不是脱离社区了?其实，每次大版本升级都会需要人力去跟进，况且
- 老容器随着业务的升级，会使用新的hash计算逻辑
- 下次跨版本升级前，可以扫描历史容器，kubelet也做了相关逻辑记录，判断能否直接丝滑升级
- 为适配业务场景，维护着自己的版本，每次升级都会评估业务影响
- 没有最好的方案，只有更合适场景的方案

## 集群现状
截止到9月1号，升级node数超过6w+，涉及 17 个k8s 集群稳定升级  
