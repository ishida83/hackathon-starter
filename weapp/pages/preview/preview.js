// pages/preview/preview.js
var app=getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgPath:'',
        userId:'',


        name:'',
        waist:"",
        bust:'',
        hip:'',
        age:'',
        height:''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var userId=options.userId;
        var imgPath=options.path;
        this.setData({
            userId:userId,
            imgPath:imgPath
        })
        this.getUserInfo(userId);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    joinCompetition:function(){
        wx.navigateTo({
            url: '../sign/sign'
        })
    },
    goBack:function(){
        wx.navigateBack();
    },
    getUserInfo:function(userId){
        var that=this;
        var serverPath=app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH;
        var apiUrl=serverPath+"/json/users/"+userId;
        wx.request({
            url: apiUrl, //仅为示例，并非真实的接口地址
            method:"GET",
            success: function(res) {
                console.log(res.data);
                that.setData({
                    "name": res.data.name||"",
                    "age": res.data.age||"",
                    "height": res.data.height||"",
                    "bust": res.data.bust||"",
                    "waist": res.data.waist||"",
                    "hip": res.data.hip||""
                })
            },
            error:function(error){
                console.error(error)
            }
        })
    }
});