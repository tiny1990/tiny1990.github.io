---
layout: post
title: kubernetes cgroup
categories: k8s
description: cgroup中的cpu有哪几种限制方式。k8s是如何使用实现request和limit的。
keywords:
---

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
[root@node-156 ~]# cat /sys/fs/cgroup/cpuset/docker/12c35c978d926902c3e5f1235b89a07e69d484402ff8890f06d0944cc17f8a71/cpuset.cpus
0-31
```
cpuset 是指定某个CPU编号，绑定到容器中使用

## cpushare
```
[root@A01-R02-I192-45-047T13D ~]# cat /sys/fs/cgroup/cpu/docker/ff3aa71b5d5fa146d20e177d12f8583afd77f0e505c371379bb1f506c28a8a2a/cpu.shares
1024
```
cpushare 用一个整数来设定 cgroup 中任务 CPU 可用时间的相对比例。例如： cpu.shares 设定为 100 的任务，即便在两个 cgroup 中，也将获得相同的 CPU 时间；但是 cpu.shares 设定为 200 的任务与 cpu.shares 设定为 100 的任务相比，前者可使用的 CPU 时间是后者的两倍，即便它们在同一个 cgroup 中。cpu.shares 文件设定的值必须大于等于 2

### cpu.cfs_period_us && cpu.cfs_quota_us

-  cpu.cfs_period_us
  此参数可以设定重新分配 cgroup 可用 CPU 资源的时间间隔，单位为微秒（µs，这里以 “us” 表示）。如果一个 cgroup 中的任务在每 1 秒钟内有 0.2 秒的时间可存取一个单独的 CPU，则请将 cpu.rt_runtime_us 设定为 2000000，并将 cpu.rt_period_us 设定为 1000000。cpu.cfs_quota_us 参数的上限为 1 秒，下限为 1000 微秒。


-  cpu.cfs_quota_us

  此参数可以设定在某一阶段（由 cpu.cfs_period_us 规定）某个 cgroup 中所有任务可运行的时间总量，单位为微秒（µs，这里以 "us" 代表）。一旦 cgroup 中任务用完按配额分得的时间，它们就会被在此阶段的时间提醒限制流量，并在进入下阶段前禁止运行。如果 cgroup 中任务在每 1 秒内有 0.2 秒，可对单独 CPU 进行存取，请将 cpu.cfs_quota_us 设定为 200000，cpu.cfs_period_us 设定为 1000000。请注意，配额和时间段参数都根据 CPU 来操作。例如，如要让一个进程完全利用两个 CPU，请将 cpu.cfs_quota_us 设定为 200000，cpu.cfs_period_us 设定为 100000。

> 如将 cpu.cfs_quota_us 的值设定为 -1，这表示 cgroup 不需要遵循任何 CPU 时间限制。这也是每个 cgroup 的默认值（root cgroup 除外）。
> cpu.cfs_quota_us / cpu.cfs_period_us 为最多使用cpu个数






