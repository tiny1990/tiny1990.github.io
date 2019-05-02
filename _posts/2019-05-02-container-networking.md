---
layout: post
title: 容器化跨主机通讯的一些思考与经验 
categories: 
description: networking 
keywords: quagga,bgp
---

在大规模的kubernetes集群情况下，网络的拓扑设计显的尤为的重要，业界的很多参考，也有很多成熟的解决方案，例如使用flannel，calicao，以及quagga等现有的解决方案。
现有的一些解决方案有时并不能解决我们的业务场景，所以会根据现有成熟方案进行一些略微的改造
我们重点分析BGP的决绝方案

# 使用
整体拓扑图和解决方案如下:

![bdp](../images/bdp.svg)