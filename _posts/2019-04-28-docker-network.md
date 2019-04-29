---
layout: post
title: 使用Quagga实现跨机器通讯 
categories: 
description: networking 
keywords: quagga,bgp
---


## 整体架构图

<object data="/images/quagga-docker.svg" type="image/svg+xml"></object>


两台安装docker的centos(虚拟机)、docker0网段已经修改 /etc/docker/daemon.json ``` {"bip":"172.2.0.1/24"} ```  
目前云主机不能模拟出来，后面会研究下，应该是系统做了限制

##  安装quagga

首先安装quagga

{% highlight ruby %}
def show
  @widget = Widget(params[:id])
  respond_to do |format|
    format.html # show.html.erb
    format.json { render json: @widget }
  end
end
{% endhighlight %}


```
# yum install quagga
```
centos7 需要关闭SELinux或者允许Zebra守护进程写入它的配置目录
```
# setsebool -P zebra_write_config 1 
```
启动2个守护进程：
- Zebra:一个核心守护进程用于内核接口和静态路由.
- BGPd:一个BGP守护进程.

## 配置日志路径

复制zebra.conf
```
# cp /usr/share/doc/quagga-?/zebra.conf.sample /etc/quagga/zebra.conf 
```
启动zebra
```
# systemctl start zebra
# systemctl enable zebra 
```
通过vtysh配置2台机器

```
# vtysh
qg1# configure terminal    ## 进入配置终端
qg1(config)# log file /var/log/quagga/quagga.log
qg1(config)# exit
qg1# write

```
## 配置对等的IP地址
> 因为是直接挂在了路由器上，此步骤可以忽略 2台机器都配置

```
# vtysh
qg1# show interface
```

```
Interface docker0 is up, line protocol detection is disabled
Interface eth0 is up, line protocol detection is disabled
Interface lo is up, line protocol detection is disabled
```

配置eth0接口
```
# vtysh
qg1# configure terminal         # 进入配置
qg1(config)# interface eth0     # 配置eth0
qg1(config)# ip address 192.168.15.107/32    # 设置ip
qg1(config)# description "to Router-A"       # 添加描述
qg1(config)# no shutdown
qg1(config)# exit
```
验证配置
```
qg1# show interface 
qg1# show interface description
```
验证正确保存配置
```
qg1# write
```

## 配置BGP对等
> 两台机器都配置

复制sample配置,并启动
```
# cp /usr/share/doc/quagga-?/bgpd.conf.sample /etc/quagga/bgpd.conf 
# systemctl start bgpd
# systemctl enable bgpd
```
查看BGP默认配置，覆盖默认配置
```
# vtysh
# show running-config 
router bgp 7675
```

配置架构图的参数
```
qg1# configure terminal
qg1# no router bgp 7675
qg1# router bgp 100
qg1# no auto-summary
qg1# no sync
qg1(config-router)# neighbor 192.168.15.108 remote-as 200
qg1(config-router)# neighbor 192.168.15.108 description "provider B"
qg1(config-router)# exit
qg1(config)# exit
qg1# write
```
路由器都被配置好，两台路由器之间的对等将被建立。运行下面的命令确认：
```
qg1# show ip bgp summary 
```

```
BGP router identifier 192.168.15.107, local AS number 100
RIB entries 3, using 336 bytes of memory
Peers 1, using 4560 bytes of memory

Neighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd
192.168.15.108  4   200     336     338        0    0    0 05:33:30        0

Total number of neighbors 1
```

## 配置前缀通告
在qg1中：
```
qg1# configure terminal
qg1(config)# router bgp 100
qg1(config)# network 172.17.0.0/24
qg1(config)# exit
qg1# write
```
在qg2中：
```
qg2# configure terminal
qg2(config)# router bgp 200
qg2(config)# network 172.17.1.0/24
qg2(config)# exit
qg2# write
```

## 验证前缀通告
```
qg1# show ip bgp summary 
```

```
Neighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd
192.168.15.108  4   200     340     342        0    0    0 05:37:18        1
```

查看细节
```
qg1# show ip bgp neighbors 192.168.15.108 advertised-routes 
```

```
   Network          Next Hop            Metric LocPrf Weight Path
*> 172.1.0.0/24     192.168.15.107           0         32768 i
```

前缀是我们从邻居接收到的
```
qg1# show ip bgp neighbors 192.168.15.108 routes
```

```
   Network          Next Hop            Metric LocPrf Weight Path
*> 172.2.0.0/24     192.168.15.108           0             0 200 i
```
查看BGP路由
```
qg1# show ip bgp
   Network          Next Hop            Metric LocPrf Weight Path
*> 172.1.0.0/24     0.0.0.0                  0         32768 i
*> 172.2.0.0/24     192.168.15.108           0             0 200 i

qg1#  show ip route
代码: K - 内核路由, C - 已链接 , S - 静态 , R - 路由信息协议 , O - 开放式最短路径优先协议,
 
       I - 中间系统到中间系统的路由选择协议, B - 边界网关协议, > - 选择路由, * - FIB 路由

# ip route 
```

## 启动一个容器测试是否能通
```
[qg1]# docker run -it -d nginx
[qg2]# curl curl 172.2.0.2
```
跨物理机的容器之间是互通的