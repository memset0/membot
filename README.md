<img align="right" width="160" src="http://q.qlogo.cn/headimg_dl?dst_uin=1470738407&spec=640">

<h1>
membot
</h1>

![](https://img.shields.io/badge/build-passing-brightgreen.svg)
![](https://img.shields.io/github/issues/memset0/membot?color=blue)
![](https://img.shields.io/github/languages/code-size/memset0/membot?color=blueviolet)
![](https://img.shields.io/badge/license-AGPL_V3.0-lightgrey.svg)

Yet Another Open Source & Cross-platform Chatbot Powered by Koishi

### Deploy

#### As an independent bot

It means you will start the bot with all features enabled. However, this will probably cost you a bit of time on the config file. Due to the limitation of my energy, template configuration files would not be provided in the near future, you can refer to the `Config` interfaces in the code by yourself.

Notice that our image operatoring service is dependent on ffmpeg to handle, make sure you have it installed before launching.

```shell
yarn
yarn start
```

#### As a koishi plugin

To make my development process more convenient, there are various complex calling relationships in the code. Therefore, we strongly recommend you to clone the whole repository and to keep its directory structure unchanged.

For example, if you just want to enable its RSS Feed feature, use `ctx.plugin`. But noticed that the RSS plugin depends on the Web Service, it's also needed to inject the Web Service before the RSS one. Then your code would be like:

```typescript
ctx.plugin(require('<path>/membot/src/services/web'));
ctx.plugin(require('<path>/membot/src/plugins/rss'));
```

### Features

* [Service: Web](./src/services/web) - Koa & Vue powered web support for displaying hypertext and so on.
* [Plugin: RSS Feed](./src/plugins/rss) - A simple RSS Feed plugin, coming with many useful configuration items.
* [Plugin: Message Forward](./src/plugins/forward) - Forward message between platforms, currently support QQ, Telegram and Kook. Supporting for Discord is WIP.
* ...

### Dependences

* [koishi - Cross-platform Chatbot Framework Made with Love](https://github.com/koishijs/koishi)
* [satori - The Universal Messenger Protocol](https://github.com/satorijs/satori)
* [go-cqhttp - cqhttp 的 golang 实现，轻量、原生跨平台](https://github.com/Mrs4s/go-cqhttp)
* [Telegram Bot API](https://core.telegram.org/bots/api)
* [KOOK 开发者平台 文档](https://developer.kookapp.cn/doc/intro)
* [OneBot 12 标准草案](https://12.onebot.dev/)
* [Vue.js - The Progressive JavaScript Framework](https://vuejs.org/)
* [Pinia - The Vue Store that you will enjoy using](https://pinia.vuejs.org/)
* [Arco Design Vue - 字节跳动出品的企业级设计系统](https://arco.design/vue)
* [github-markdown-css - The minimal amount of CSS to replicate the GitHub Markdown style](https://github.com/sindresorhus/github-markdown-css)
* [QQ Face ID Table](https://qq-face.vercel.app/)
* [漢典 - 漢語字典, 漢語詞典, 康熙字典, 說文解字, 音韻方言, 字源字形, 異體字](https://www.zdic.net)
* [RSS Hub - 🍰 万物皆可 RSS](https://docs.rsshub.app/)
* [小嘿作文生成器 - 可根据输入的主题谓语、主题宾语，自动随机生成海量作文。适用于中学考试议论文的学习与研究](https://zuowen.jackjyq.com/)
* [DoMCer API](http://api.domcer.com/)
* [~~(Deprecated) art-template - 高性能 JavaScript 模板引擎~~](https://aui.github.io/art-template/)
* [~~(Deprecated) 王斌给您对对联 -_-!~~](https://ai.binwang.me/couplet/)
* [~~(Deprecated) 文学网 - 文言文字典~~](https://wyw.hwxnet.com/)
