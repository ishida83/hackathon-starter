//app.js

App({
    onLaunch: function () {
        this.getOpenId(function(openid){
            console.log(openid);
        });
    },

    getOpenId:function(callback){
        var that=this;
        var openIdFromLocal= wx.getStorageSync("openid");
        if(openIdFromLocal)
        {
            callback(openIdFromLocal);
        }
        else
        {
            wx.login({
                success: function(res){
                    var apiUrl=that.globalData.GLOBAL_CONFIG[that.globalData.CURRENT_ENVIRONMENT].API_PATH+"/api/wechat/open_id?code="+res.code;
                    wx.request({
                        url: apiUrl,
                        method:"GET",
                        success: function(res) {
                            console.log(res.data);
                            var openid=res.data.openid;
                            wx.setStorageSync("openid",openid);
                            callback(openid);
                        },
                        fail:function(error){
                            wx.showToast({
                                title: '获取用户信息失败',
                                icon:"none"
                            });
                            console.error(error)
                        }
                    });
                }
            })
        }
    },
    globalData: {
        PAGE_SIZE:10,
        CURRENT_ENVIRONMENT:"DEV",//DEV\TEST\PROD
        GLOBAL_CONFIG:{
            DEV:{
                API_PATH:"https://wx.9jzhy.com:8081"
            },
            TEST:{
                API_PATH:"https://wx.9jzhy.com:8081"
            },
            PROD:{
                API_PATH:"https://wx.9jzhy.com:8081"
            }
        }
    }
});