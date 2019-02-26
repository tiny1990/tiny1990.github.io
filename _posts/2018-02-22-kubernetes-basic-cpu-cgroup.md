---
layout: post
title: kubernetes cgroup
categories: k8s
description: cgroup中的cpu有哪几种限制方式。k8s是如何使用实现request和limit的。
keywords:
---

> 总结版: k8s limit中是设置的真实限定大小，request是给调度器选node使用的，上产环境用cpuset能更灵活的调度，很少用cpuset，cgroup默认使用完全公平调度，通过cfs_quota_us，cfs_period_us来控制执行，cfs_quota_us / cfs_period_us 是最大使用cpu核数


# docker 中cpu的管理

默认，容器会使用物理机的cpu是不受限制的，我们可以通过参数设置cpu的使用，大多数我们使用的是完全公平调度

```
--cpus=<value>              Specify how much of the available CPU resources a container can use. (--cpu=1.5  --cpu-period="100000" and --cpu-quota="150000")
--cpu-period=<value>        Specify the CPU CFS scheduler period, which is used alongside --cpu-quota. Defaults to 100 micro-seconds.
--cpu-quota=<value>         The number of microseconds per --cpu-period that the container is limited to before throttled. 
--cpuset-cpus               Limit the specific CPUs or cores a container can use.
--cpu-shares                CPU shares (relative weight)
```

## cpuset-cpus
```
[root@node-156 ~]# cat /sys/fs/cgroup/cpuset/docker/12/cpuset.cpus
0-31
```
cpuset 是指定某个CPU编号，绑定到容器中使用

## cpushare
```
[root@A01-R02-I192-45-047T13D ~]# cat /sys/fs/cgroup/cpu/docker/ff/cpu.shares
1024
```
cpushare 用一个整数来设定 cgroup 中任务 CPU 可用时间的相对比例。例如： cpu.shares 设定为 100 的任务，即便在两个 cgroup 中，也将获得相同的 CPU 时间；但是 cpu.shares 设定为 200 的任务与 cpu.shares 设定为 100 的任务相比，前者可使用的 CPU 时间是后者的两倍，即便它们在同一个 cgroup 中。cpu.shares 文件设定的值必须大于等于 2

###  cpu.cfs_period_us
  此参数可以设定重新分配 cgroup 可用 CPU 资源的时间间隔，单位为微秒（µs，这里以 “us” 表示）。如果一个 cgroup 中的任务在每 1 秒钟内有 0.2 秒的时间可存取一个单独的 CPU，则请将 cpu.rt_runtime_us 设定为 2000000，并将 cpu.rt_period_us 设定为 1000000。cpu.cfs_quota_us 参数的上限为 1 秒，下限为 1000 微秒。


### cpu.cfs_quota_us

  此参数可以设定在某一阶段（由 cpu.cfs_period_us 规定）某个 cgroup 中所有任务可运行的时间总量，单位为微秒（µs，这里以 "us" 代表）。
  如将 cpu.cfs_quota_us 的值设定为 -1，这表示 cgroup 不需要遵循任何 CPU 时间限制。这也是每个 cgroup 的默认值（root cgroup 除外）。

> cpu.cfs_quota_us / cpu.cfs_period_us 为最多使用cpu个数

参考 https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/resource_management_guide/sec-cpu#sect-cfs



# kubernetes中的CPU使用

kubernetes对容器可以设置两个值：
```
spec.containers[].resources.limits.cpu
spec.containers[].resources.requests.cpu
```
**limits**  主要用以声明使用的最大的CPU核数。通过设置cfs_quota_us和cfs_period_us。比如limits.cpu=3，则cfs_quota_us=300000。

>  cfs_period_us值一般都使用默认的100000

**request**  
声明最小的CPU核数。一方面则体现在设置cpushare上。比如request.cpu=3，则cpushare=1024*3=3072。
当创建一个Pod时，Kubernetes调度程序将为Pod选择一个节点。每个节点具有每种资源类型的最大容量：可为Pods提供的CPU和内存量。调度程序确保对于每种资源类型，调度的容器的资源请求的总和小于节点的容量。尽管节点上的实际内存或CPU资源使用量非常低，但如果容量检查失败，则调度程序仍然拒绝在节点上放置Pod。
而计算节点CPU的已经分配的量就是通过计算所有容器的request的和得到的。






