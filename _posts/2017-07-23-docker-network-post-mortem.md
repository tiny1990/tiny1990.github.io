---
layout: post
title: docker swarm 遇到的一次坑
categories: docker
description: docker swarm network 故障
keywords: docker,networking
---

# docker swarm network 故障

## 故障描述
DpInc 整个系统跑在docker swarm mode，在第30天时出现sourcemysql容器(容器所在机器名swarm02)不能访问schemaregistry容器(容器所在机器swarm00)的8081端口。

![docker](/img/docker/network-1.png)

```shell
$ swarm-01 可以访问在```swarm-00``` 上的```container-1``` 服务
$ swarm-02 可以访问在```swarm-00``` 上的```container-2``` 服务
$ swarm-02 访问在```swarm-00``` 上的```container-1``` 服务 
```

## 排错过程

1. 检查 swarm00 机器 iptables iptables -nvL | grep "8081"  查看机器上8081端口是否被reject

```shell
 3538  250K ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:8081
 2747  222K ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            state RELATED,ESTABLISHED tcp spt:8081
```
iptables规则正常

2. 检查 swarm00 机器 container-1 iptables 和 router 正常
```
# docker inspect 9a556e2998b5 | grep /var/run
"SandboxKey": "/var/run/docker/netns/7ca58b86b82c",

# ip netns exec 7ca58b86b82c ip route show
default via 172.19.0.1 dev eth1
10.0.0.0/24 dev eth0  proto kernel  scope link  src 10.0.0.31
10.255.0.0/16 dev eth2  proto kernel  scope link  src 10.255.0.18
172.19.0.0/16 dev eth1  proto kernel  scope link  src 172.19.0.8

# ip netns exec 7ca58b86b82c iptables -nvL
Chain INPUT (policy ACCEPT 36M packets, 2243M bytes)
 pkts bytes target     prot opt in     out     source               destination
11182  903K ACCEPT     tcp  --  *      *       0.0.0.0/0            10.255.0.18          tcp dpt:8081 ctstate NEW,ESTABLISHED

Chain OUTPUT (policy ACCEPT 19M packets, 1662M bytes)
 pkts bytes target     prot opt in     out     source               destination
 8758  695K ACCEPT     tcp  --  *      *       10.255.0.18          0.0.0.0/0            tcp spt:8081 ctstate ESTABLISHED
```

3. 抓取 swarm02 container访问 swam00 container 数据包
```
更换阿里源提速
# echo 'deb http://mirrors.aliyun.com/debian jessie main' > /etc/apt/sources.list
# apt-get update && apt-get install tcpdump
# tcpdump -i eth0 -w /tmp/tcpdump.pack
```
发现数据异常
![tcpdump](/img/docker/tcpdump.jpeg)

问出处在握手包上，每次 swarm02 主动握手，都会被 rst , rst 包通常情况出现在:
1. 端口未打开 
2. 请求超时
3. 提前关闭 
4. 其他原因 http://windtear.net/2009/10/iptables_drop_reset.html  
排除  1 2 ,因为 swarm-02 可以正常访问，可能出现在 3 , 4 上，提前关闭不太能，因为有机器能访问swarm00，使用 4 给出链接解决
```
简单解决是忽略这种类型的全部 RST 包
iptables -I INPUT -p tcp --tcp-flags SYN,FIN,RST,URG,PSH RST -j DROP
```

## 是否完全解决
否  
调研了下关于tcp rst 方面的知识，很少有出现在tcp 握手时刻被rst的，引发问题真正原因可能是docker swarm 的bug

## 最终处理方案
- 升级了docker，新版本对network有改动，有人提tcp rst相关的issue
- 持续观察，是否还会出现问题


# docker network 相关技术

## docker overlay network原理
![network-space-3](/img/docker/docker-overlay-network-0.png)

1. container的eth0接到docker overlay network上
2. br0虚拟交换，发现时本机container请求直接通讯，如果是跨主机通讯，需要走vxlan
3. vxlan划分不同id隔离多个自定义overlay网络
4. docker 通过k/v存储将转发到指定机器上
5. 通过mac地址转发到对应宿主机网卡
6. 转发到容器
7. 到达container

## 自己实现vxlan
host1 (10.0.0.1)
```
ip link add vxlan0 type vxlan id 42 dev eth0 dstport 0
bridge fdb append to 00:00:00:00:00:00 dst 10.0.0.2 dev vxlan0
ip addr add 192.168.200.1/24 dev vxlan0
ip link set up dev vxlan0
```
host2 (10.0.0.2)
```
ip link add vxlan0 type vxlan id 42 dev eth0 dstport 0
bridge fdb append to 00:00:00:00:00:00 dst 10.0.0.1 dev vxlan0
ip addr add 192.168.200.2/24 dev vxlan0
ip link set up dev vxlan0
```

host1上测试
```
ping -c4 192.168.200.2
```

# 关于 network namespace 相关技术

## docker local network

![network-space-0](/img/docker/network-space-0.png)  
docker 单机模式，就是利用linxu network namespace 将 container和宿主机网络隔离，然后创建一个veth pair(图1 蓝色部分),他相当于一根网线两端,连接container和宿主机

## 手动创建一个网络拓扑
1. 创建两个network space
```
# ip netns add container-1
# ip netns add container-2
# ip netns list
# ls /var/run/netns
```
/var/run/netns 可以看到两个由 ip netns  创建的两个namespace  
使用 ip netns exec container-1 ip addr 查看namespace网卡信息
```
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```
此刻只有一个环回网卡

拓扑图
![network-space-1](/img/network-space-1.png)

2. 创建br0

```
# brctl addbr br0
# brctl show
```
分配ip 并启用
```
# ip addr add 172.16.1.1/16 dev br0
# ip link set dev br0 up
# route -n
172.16.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br0
```
> 此刻 如果 ip addr add 多个ip，会出现由ip 处于 secondary  状态

拓扑图
![network-space-2](/img/docker/network-space-2.png)

3. 创建veth-pair
```
# ip link add veth1 type veth peer name veth1p
# brctl addif br0 veth1
# ip link set veth1 up
# ip link add veth2 type veth peer name veth2p
# brctl addif br0 veth2
# ip link set veth2 up
```
拓扑图
![network-space-3](/img/docker/network-space-3.png)

4. 插网线

将veth-pairs一端放到namespace中，并重命名为eth0
```
# ip link set veth1p netns container-1
# ip netns exec container-1 ip link set veth1p name eth0
# ip link set veth2p netns container-2
# ip netns exec container-2 ip link set veth2p name eth0
# ip netns exec container-1 ip link set eth0 up
# ip netns exec container-1 ip addr add 172.16.1.2/16 dev eth0
# ip netns exec container-2 ip link set eth0 up
# ip netns exec container-2 ip addr add 172.16.1.3/16 dev eth0
```
最终实现所有拓扑，使用 ip netns exec container-1 ping  172.16.1.3 验证网络互通

## 验证docker local network
docker 的namespace 在 /var/run/docker/netns ，所以使用 ip netns list   并不能看到docker创建的namespace  
查看docker nanemspac需要:
```
1. ln -s /var/run/docker/netns /var/run/netns ，再使用 ip netns list 即可看到每个容器的namespace
2. docker inspect -f '{{.NetworkSettings.SandboxKey}}' container-id 获取namespaceid
3. ip netns exec namespaceid ip addr  
```

## 提高
自己动手抓取container 数据包
1. tcpdump in host
2. tcpdump in container

