---
layout: post
title: docker网络之 flannel
categories: docker
description:  flannel 是CoreOs团队开源容器网络解决方案
keywords: docker,networking,
---

  flannel 是CoreOs团队开源容器网络解决方案，能很简单的做到单容器单IP，flannel需要一个 k-v 存储(like etcd or consul)，和docker集成需要需要修改dockerd配置，让docker网络托管于flanne。

# 安装
  前面提到，flannel 需要一个kv 存储所有节点的网络信息，首先安装etcd。
  github https://github.com/coreos/etcd/releases 上有最新release
## etcd 安装  
  - 下载二进制
  ```shell
  [root@VM_132_1_centos ~]# curl -LO \
  https://github.com/coreos/etcd/releases/download/v3.2.15/etcd-v3.2.15-linux-amd64.tar.gz  
  ```
  - 解压压缩包，把编译好的二进制移动到/usr/bin
  ```shell
  [root@VM_132_1_centos ~]# tar xvf etcd-v3.2.15-linux-amd64.tar.gz
  [root@VM_132_1_centos ~]# mv ./etcd-v3.2.15-linux-amd64/etcd* /usr/bin
  ```
  - 编辑systemd配置
  运行 sudo vi /lib/systemd/system/etcd.service，添加一下配置
  ```shell
    [Unit]
    Description=etcd key-value store
    Documentation=https://github.com/coreos/etcd
    After=network.target
    [Service]
    Environment=DAEMON_ARGS=
    Environment=ETCD_NAME=%H
    Environment=ETCD_ADVERTISE_CLIENT_URLS=http://0.0.0.0:2379
    Environment=ETCD_LISTEN_CLIENT_URLS=http://0.0.0.0:2379
    Environment=ETCD_LISTEN_PEER_URLS=http://0.0.0.0:2378
    Environment=ETCD_DATA_DIR=/var/lib/etcd/default
    Type=notify
    ExecStart=/usr/bin/etcd $DAEMON_ARGS
    Restart=always
    RestartSec=10s
    LimitNOFILE=65536
    [Install]
    WantedBy=multi-user.target
  ```
  - 启动etcd并检查服务状态
  ```shell
  [root@VM_132_1_centos ~]# sudo systemctl daemon-reload
  [root@VM_132_1_centos ~]# sudo systemctl enable etcd
  [root@VM_132_1_centos ~]# sudo systemctl start etcd
  [root@VM_132_1_centos ~]# systemctl status etcd
  ```
  显示服务状态正常
  ```shell
[root@VM_132_1_centos ~]# systemctl status etcd                                           
● etcd.service - etcd key-value store                                                     
   Loaded: loaded (/usr/lib/systemd/system/etcd.service; enabled; vendor preset: disabled)
   Active: active (running) since Sat 2018-01-27 23:27:56 CST; 7s ago                     
     Docs: https://github.com/coreos/etcd                                                 
 Main PID: 9280 (etcd)                                                                    
   CGroup: /system.slice/etcd.service                                                     
           └─9280 /usr/bin/etcd
  ```
  - 创建flannel 配置
  ```shell
  [root@VM_132_1_centos ~]# etcdctl mk /coreos.com/network/config \
'{"Network":"10.0.0.0/16"}'
  ```

## flannel 安装
- 下载二进制
```shell
[root@VM_132_1_centos ~]# curl -LO \
 https://github.com/coreos/flannel/releases/download/v0.10.0/flannel-v0.10.0-linux-amd64.tar.gz
[root@VM_132_1_centos ~]# tar xvf flannel-v0.10.0-linux-amd64.tar.gz
[root@VM_132_1_centos ~]# mv ./flanneld /usr/bin
```
- 配置systemd
sudo vi /lib/systemd/system/flanneld.service
```shell
  [Unit]
  Description=Flannel Network Fabric
  Documentation=https://github.com/coreos/flannel
  Before=docker.service
  After=etcd.service

  [Service]
  Environment='DAEMON_ARGS=--etcd-endpoints=http://10.144.132.1:2379'
  Type=notify
  ExecStart=/usr/bin/flanneld $DAEMON_ARGS
  Restart=always
  RestartSec=10s
  LimitNOFILE=65536

  [Install]
  WantedBy=multi-user.target

```
- 启动flannel
```shell
[root@VM_132_1_centos ~]# sudo systemctl daemon-reload
[root@VM_132_1_centos ~]# sudo systemctl enable flanneld
[root@VM_132_1_centos ~]# sudo systemctl start flanneld
[root@VM_132_1_centos ~]# systemctl status flanneld
```
启动正常
```shell
[root@VM_132_1_centos ~]# systemctl status flanneld
● flanneld.service - Flannel Network Fabric
   Loaded: loaded (/usr/lib/systemd/system/flanneld.service; enabled; vendor preset: disabled)
   Active: active (running) since Sun 2018-01-28 09:25:04 CST; 41s ago
     Docs: https://github.com/coreos/flannel
 Main PID: 9450 (flanneld)
   CGroup: /system.slice/flanneld.service
           └─9450 /usr/bin/flanneld --etcd-endpoints=http://10.144.132.1:2379
```
此时物理机会增加一块虚拟网卡
```shell
[root@VM_132_1_centos ~]# ip addr
3: flannel0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1472 qdisc pfifo_fast state UNKNOWN qlen 500
    link/none
    inet 10.0.38.0/16 scope global flannel0
       valid_lft forever preferred_lft forever
```
- 查看网络变化
```shell
 [root@VM_132_1_centos ~]# ethtool -i flannel0
 driver: tun
 version: 1.6
 firmware-version:
 expansion-rom-version:
 bus-info: tun
 supports-statistics: no
 supports-test: no
 supports-eeprom-access: no
 supports-register-dump: no
 supports-priv-flags: no
 [root@VM_132_1_centos ~]# ip route
 default via 10.144.128.1 dev eth0
 10.0.0.0/16 dev flannel0  proto kernel  scope link  src 10.0.38.0
```
- 跨机器网络可以通
```shell
[root@VM_132_1_centos ~]# ping 10.0.89.0
PING 10.0.89.0 (10.0.89.0) 56(84) bytes of data.
64 bytes from 10.0.89.0: icmp_seq=1 ttl=62 time=0.340 ms
```

# 集成docker
- 安装docker，就用官方最快速的方法安装了
```shell
[root@VM_132_1_centos ~]# yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2
[root@VM_132_1_centos ~]# yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
[root@VM_132_1_centos ~]# yum install docker-ce    
```
- 生成dockerd需要的配置,也可以直接用/run/flannel/subnet.env
```shell
[root@VM_132_1_centos ~]# ./mk-docker-opts.sh
[root@VM_132_1_centos ~]# cat /run/docker_opts.env
DOCKER_OPT_BIP="--bip=10.0.38.1/24"
DOCKER_OPT_IPMASQ="--ip-masq=true"
DOCKER_OPT_MTU="--mtu=1472"
DOCKER_OPTS=" --bip=10.0.38.1/24 --ip-masq=true --mtu=1472"
```
- 修改dockerd参数，在servoce中添加两行,启动docker
```shell
[root@VM_132_1_centos ~]# /usr/lib/systemd/system/docker.service
EnvironmentFile=/run/flannel/subnet.env
ExecStart=/usr/bin/dockerd --bip=${FLANNEL_SUBNET} --mtu=${FLANNEL_MTU}
[root@VM_132_1_centos ~]# systemctl daemon-reload
[root@VM_132_1_centos ~]# systemctl start docker
[root@VM_132_1_centos ~]# systemctl status docker
[root@VM_132_1_centos ~]# ip addr
4: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN
    link/ether 02:42:16:0d:1c:df brd ff:ff:ff:ff:ff:ff
    inet 10.0.38.1/24 brd 10.0.38.255 scope global docker0
       valid_lft forever preferred_lft forever
```
- 测试跨主机 docker0 是否能ping通
```shell
[root@VM_132_1_centos ~]# ping 10.0.89.1
PING 10.0.89.1 (10.0.89.1) 56(84) bytes of data.
64 bytes from 10.0.89.1: icmp_seq=1 ttl=62 time=0.363 ms
```
- 测试 ip per continer,能访问ng
```shell
[root@VM_132_1_centos ~]# docker run -d --name ng1 nginx
[root@VM_132_1_centos ~]# docker inspect ng1 | grep IPAddress
[root@VM_198_1_centos ~]# curl ng1-ip
```
# flannel 的几种模式
- xvlan
```shell
[root@VM_132_1_centos ~]# etcdctl set /coreos.com/network/config '{"Network":"10.100.0.0/16",
"Backend": {"Type": "vxlan"}}'
```
- host-gw,注意ip route的变化
```shell
[root@VM_132_1_centos ~]# etcdctl set /coreos.com/network/config \
'{"Network":"10.100.0.0/16", "Backend": {"Type": "host-gw"}}'
```

