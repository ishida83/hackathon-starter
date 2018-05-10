
### 1、全局搜索

?q      optional 全文搜索 是什么含义？q参数取哪些值？

### 2、登录接口会报错
调用示例（此时code已失效，需要联调时我可以再获取个）：
http://115.28.204.5:8080/api/wechat/open_id?code=011xqeTk2ZH1vG0xb6Qk2ZGwTk2xqeTB
是否是我的入参格式有误？或者服务端未配置我这边测试小程序的appID和AppSecret


### 3、上传图片接口
###### ①、上传图片时，不需要携带用户的报名信息吗？姓名电话体重三围等字段。
###### ②、上传图片接口报错，不知道是否是我openid随便写的缘故。
（这个报错在微信小程序的uploadImg方法和postman的formdata传文件模式中，都会出现）


<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Error</title>
    </head>
    <body>
        <pre>Error: Unexpected field
            <br> &nbsp; &nbsp;at makeError (C:\Users\Administrator\Desktop\wechat\node_modules\multer\lib\make-error.js:12:13)
            <br> &nbsp; &nbsp;at wrappedFileFilter (C:\Users\Administrator\Desktop\wechat\node_modules\multer\index.js:40:19)
            <br> &nbsp; &nbsp;at Busboy.&lt;anonymous&gt; (C:\Users\Administrator\Desktop\wechat\node_modules\multer\lib\make-middleware.js:114:7)
            <br> &nbsp; &nbsp;at Busboy.emit (events.js:180:13)
            <br> &nbsp; &nbsp;at Busboy.emit (C:\Users\Administrator\Desktop\wechat\node_modules\busboy\lib\main.js:38:33)
            <br> &nbsp; &nbsp;at PartStream.&lt;anonymous&gt; (C:\Users\Administrator\Desktop\wechat\node_modules\busboy\lib\types\multipart.js:213:13)
            <br> &nbsp; &nbsp;at PartStream.emit (events.js:180:13)
            <br> &nbsp; &nbsp;at HeaderParser.&lt;anonymous&gt; (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\Dicer.js:51:16)
            <br> &nbsp; &nbsp;at HeaderParser.emit (events.js:180:13)
            <br> &nbsp; &nbsp;at HeaderParser._finish (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\HeaderParser.js:68:8)
            <br> &nbsp; &nbsp;at SBMH.&lt;anonymous&gt; (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\HeaderParser.js:40:12)
            <br> &nbsp; &nbsp;at SBMH.emit (events.js:180:13)
            <br> &nbsp; &nbsp;at SBMH._sbmh_feed (C:\Users\Administrator\Desktop\wechat\node_modules\streamsearch\lib\sbmh.js:159:14)
            <br> &nbsp; &nbsp;at SBMH.push (C:\Users\Administrator\Desktop\wechat\node_modules\streamsearch\lib\sbmh.js:56:14)
            <br> &nbsp; &nbsp;at HeaderParser.push (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\HeaderParser.js:46:19)
            <br> &nbsp; &nbsp;at Dicer._oninfo (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\Dicer.js:197:25)
            <br> &nbsp; &nbsp;at SBMH.&lt;anonymous&gt; (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\Dicer.js:127:10)
            <br> &nbsp; &nbsp;at SBMH.emit (events.js:180:13)
            <br> &nbsp; &nbsp;at SBMH._sbmh_feed (C:\Users\Administrator\Desktop\wechat\node_modules\streamsearch\lib\sbmh.js:188:10)
            <br> &nbsp; &nbsp;at SBMH.push (C:\Users\Administrator\Desktop\wechat\node_modules\streamsearch\lib\sbmh.js:56:14)
            <br> &nbsp; &nbsp;at Dicer._write (C:\Users\Administrator\Desktop\wechat\node_modules\dicer\lib\Dicer.js:109:17)
            <br> &nbsp; &nbsp;at doWrite (_stream_writable.js:410:12)
        </pre>
    </body>
</html>


### 4、/api/images接口
可否手工加些假数据，我明天可以优先做瀑布流的数据。