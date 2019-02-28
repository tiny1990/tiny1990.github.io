---
layout: post
title: linux 性能分析之cpu
categories: linux
description: 性能之巅读书笔记
keywords: 读书笔记
---


# 术语
## CPU架构与术语解释

![CPU架构](/images/cpu.png)

-  处理器(processor):  插到系统槽或主板上的物理芯片，可以是一块或者多块
-  核(Core): 多核处理器上的一个独立的CPU实例，核是使用处理器的一种扩展方式 
-  硬件线程(Hardware thread): 在同一个核上同时能执行多个线程的CPU架构

### CPU绑定
把一个进程和线程绑定到单个CPU或者CPU组上，这样可以提升内存I/O的性能
主要有两种实现方式:
-  进程绑定  配置一个进程跑在单个CPU上
-  独占CPU组  将CPU分组，进程只能跑在这些分组上

linux的cpuset可以实现这一功能

```
# mkdir /dev/cpuset
# mount -t cpuset cpuset /dev/cpuset 
# cd /dev/cpuset
# mkdir prodset  # create a cpuset called "prodset"
# cd prodset
# echo 7-10 > cpus # assign CPUs 7-10
# echo 1 > cpu_exclusive # make prodset exclusive
# echo 1159 > tasks # assign PID 1159 to prodset
```

## CPU内存缓存

为了提高内存的I/O性能，处理器提供多种硬件缓存，级数越小的速度越快，同时也引入一些线程数据共享同步问题和并发问题。

![内存缓存](/images/cpu-cache.png)

## CPU运行队列

![CPU运行队列](/images/cpu-queue.png)

正在运行和就绪运行的线程数量，表示了**CPU的饱和度**，上图表示有四个线程和一个CPU上运行的线程。花在等待CPU运行上的时间称为**运行队列延时**。
内核会为每个CPU提供一个运行队列，并尽量使同一个线程运行在同一个队列中，这样避免了上下文切换，提高性能。


# 常用工具及名词解释
一些linux 下的cpu性能分析工具，使用方法

## uptime
打印1，5，15分钟的平均负载
```
pi@raspberrypi:~ $ uptime
 15:48:27 up 4 days,  5:37,  1 user,  load average: 0.28, 0.13, 0.09
```
**平均负载** 
是指单位时间内，系统处于可运行状态和不可中断状态的平均进程数。
这个值不是cpu使用率，是通过正在运行的线程数和正在排队的线程数计算的。
这个值的意义：平均负载大于CPU个数，表示CPU不足以服务线程，有线程在等待；小于线程数表示有余量，线程想执行的时候执行。

**平均负载 vs CPU 使用率**
平均负载和CPU使用率并不一定是一样的
- CPU 密集型进程，使用大量 CPU 会导致平均负载升高，此时这两者是一致的
- I/O 密集型进程，等待 I/O 也会导致平均负载升高，但CPU 使用率不一定很高

## 
