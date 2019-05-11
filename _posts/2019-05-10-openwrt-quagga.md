---
layout: post
title: 给openwrt安装quagga 
categories: 
description: networking 
keywords: quagga,bgp
---

  我们有一部分集群是使用BGP的网络模式,基于quagga + calico 进行了一部分功能的改造，由于本地没有物理机，测试起来比较麻烦。  
  今天灵机一动，尝试在花了35块钱买的路由器上安装quagga，过程比较曲折，搞了一天才把这玩意搞定。

## 刷pandora固件
未加电情况下，按下rest，进入breek web,选择固件升级即可

## 准备编译环境
对于跨平台编译的环境，官方给出了一个安装步骤  ```https://oldwiki.archive.openwrt.org/doc/devel/crosscompile``` 之前按照这个方式，比较麻烦，网上有人准备了docker环境，一键启动。
```
docker run -it --network=host -d -v/root/quagga-0.99.22.1:/root/quagga-0.99.22.1 openwrtio/openwrt-sdk-gee-ralink  bash
```
把本地的quagga源码映射到容器中，方便修改，拷贝文件

直接开始编译
```
export STAGING_DIR=/root/openwrt/hc5761/staging_dir/toolchain-mipsel_r2_gcc-4.6-linaro_uClibc-0.9.33.2/bin 
STAGING_DIR=/root/openwrt/hc5761/staging_dir/toolchain-mipsel_r2_gcc-4.6-linaro_uClibc-0.9.33.2/bin \
CC=/root/openwrt/hc5761/staging_dir/toolchain-mipsel_r2_gcc-4.6-linaro_uClibc-0.9.33.2/bin/mipsel-openwrt-linux-gcc \
./configure \
--with-gnu-ld=mipsel-openwrt-linux-ld \
--build=x86_64-unknown-linux-gnu  \
-host=mips-openwrt-linux-uclibc \
--libdir=/opt/lib  \
--enable-zebra \
--enable-bgpd   \
--enable-user=root  \
--enable-group=root
```

## 问题记录
- --enable-vtysh
目前如果开启vtysh报错
``` 
checking for main in -lreadline... no
configure: error: vtysh needs libreadline but was not found and usable on your system.
```
找不到依赖，查看```toolchain-mipsel_r2_gcc-4.6-linaro_uClibc-0.9.33.2```存在readline的lib  
有时间需要确认下，不过没啥太大关系，使用telnet一样配置quagga

- openwrt报错提示找不到libzebra.so  
  设置--libdir=/opt/lib 然后把编译出来的so文件复制到/opt/lib即可

- 缺少依赖的排查  
  使用ldd命令，可以查看可执行文件的so依赖，以及缺少的会```=> not found```

- 运行bgpd没任何提示信息  
  第一次编译的时候没有指定```enable-user```导致在root下启不来，路由器并没有报错