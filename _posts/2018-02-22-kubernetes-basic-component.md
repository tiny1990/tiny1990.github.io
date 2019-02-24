---
layout: post
title: kubernetes 组件
categories: k8s
description: kubernetes包含几个组件。各个组件的功能是什么。组件之间是如何交互的。
keywords:
---

# Master Components

Master组件提供的是集群的控制面，是全局决策者(调度等),发现和相应集群的事件(当副本数不足时启动新的pod)


## kube-apiserver
提供 kubernetes 的API，提供kubernetes的前端到后端的访问(web的resut api)，并且支持水平扩展，通过部署多个apiserver 增强可靠性

## etcd
自身高可用的kv存储，存储k8s左右后端的集群数据

## kube-scheduler
该组件监控创建pod事件，分配node运行pod

## kube-controller-manager
该组件运行master上controller
理论上每个controller是一个单独的进程，但是为了较小复杂度，所有的控制器都打成一个二进制文件，运行在一个进程。
控制器有：
-  Node Controller: 当node宕了，负责通知和响应
-  Replication Contrller: 负责维持正确的pod副本数
-  Endpoint Contrller: 归属Endpoint 对象(加入Service和Pod)
-  Service Account & Token Controllers: 为新的namespace创建初始账号和api的token



# Node Components
Node的组件运行在每个node上，负责运行容器和提供kubernetes的运行环境

## kubelet
作为一个agent运行在每个node上，确保pod中的每个容器运行
-  挂载 Pod 所需要的数据卷(Volume)。
-  下载 Pod 的 secrets。
-  通过 Docker 运行(或通过 rkt)运行 Pod 的容器。
-  周期性的对容器生命周期进行探测。
-  如果需要，通过创建 镜像 Pod（Mirror Pod） 将 Pod 的状态报告回系统的其余部分。
-  将节点的状态报告回系统的其余部分。

## kube-proxy
kube-proxy通过维护主机上的网络规则并执行连接转发，实现了Kubernetes服务抽象。
## Container Runtime
容器运行提供容器运行环境，目前kubernetes支持运行时: docker,containerd.cri-o,rktlet 和实现了kubernetes cri接口的。