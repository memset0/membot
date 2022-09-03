<img align="right" width="160" src="http://q.qlogo.cn/headimg_dl?dst_uin=1470738407&spec=640">

<h1>membot</h1>

Yet Another Open Source & Cross-platform Chatbot Powered by Koishi

### Usage

#### Deploy as a bot

This project is dependent on `ffmpeg` to handle media files, make sure you have it installed.

```shell
yarn
yarn start
```

#### Use as a koishi plugin

In order to make development more convenient, there are various complex calling relationships in its code. So we strongly recommend that if you clone the whole repository first and keep its directory structure unchanged.

For example, if you want to enable its RSS Feed feature, use `ctx.plugin(require(<path-of-membot/src/plugins/rss)` to install it. Note that the RSS plugin depends on the web service, so you also need to install the Web Service plugin the same way.

### Features

* [Plugin: RSS Feed](./src/plugins/rss)
* [Plugin: Message Forward](./src/plugins/forward)
* ...

### Dependences

* [koishi - Cross-platform Chatbot Framework Made with Love](https://github.com/koishijs/koishi)
* [satori - The Universal Messenger Protocol](https://github.com/satorijs/satori)
* [go-cqhttp - cqhttp 的 golang 实现，轻量、原生跨平台](https://github.com/Mrs4s/go-cqhttp)
* [OneBot 12 标准草案](https://12.onebot.dev/)
* [Telegram Bot API](https://core.telegram.org/bots/api)
* [KOOK 开发者平台 文档](https://developer.kookapp.cn/doc/intro)
* [art-template - 高性能 JavaScript 模板引擎](https://aui.github.io/art-template/)
* [QQ Face ID Table](https://qq-face.vercel.app/)
* [漢典 - 漢語字典, 漢語詞典, 康熙字典, 說文解字, 音韻方言, 字源字形, 異體字](https://www.zdic.net)
* [DoMCer API](http://api.domcer.com/)
* [RSS Hub - 🍰 万物皆可 RSS](https://docs.rsshub.app/)
* [小嘿作文生成器 - 可根据输入的主题谓语、主题宾语，自动随机生成海量作文。适用于中学考试议论文的学习与研究](https://zuowen.jackjyq.com/)
<!-- * [王斌给您对对联 -_-!](https://ai.binwang.me/couplet/) -->
<!-- * [文学网 - 文言文字典](https://wyw.hwxnet.com/) -->