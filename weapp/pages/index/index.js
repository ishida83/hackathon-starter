/* eslint-disable */
var app = getApp();
var pageIndex=1;
Page({
    data: {
        pageIndex:1,
        imgList:[],
        serverPath:app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH,
        noData:false
    },
    joinCompetition:function(events){
        wx.navigateTo({
            url: '../sign/sign'
        })
    },
    openDetail:function(events){
        var index=parseInt(events.currentTarget.dataset.index);
        var obj=this.data.imgList.find(item => item.id === index);
        var imgPath=obj.original_img_path;
        var userId=obj.userId;
        wx.navigateTo({
            url: '../preview/preview?path='+imgPath+"&userId="+userId
        })
    },
    favoriteEvents:function(events){
        var id=events.currentTarget.dataset.id;
        var imgList =this.data.imgList;
        for(var i=0;i<imgList.length;i++)
        {
            if(imgList [i].id===id)
            {
                var apis= imgList [i].favorite===true?"unlike":"like";
                var prompt=imgList[i].favorite===true?"取消点赞成功":"点赞成功";
                var that=this;
                app.getOpenId(function(openid){
                    var serverPath=app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH;
                    var apiUrl=serverPath+"/api/"+apis+"?open_id="+openid+"&image_id="+id;
                    wx.request({
                        url: apiUrl, //仅为示例，并非真实的接口地址
                        method:"POST",
                        success: function(res) {
                            console.log(res.data);
                            wx.showToast({
                                title: prompt,
                                icon:"success"
                            });

                            if(res.data.userId)
                            {
                                wx.setStorageSync('userId', res.data.userId);
                            }
                        },
                        error:function(error){
                            console.error(error)
                        }
                    })
                });
                imgList [i].favorite=!imgList [i].favorite;
                break;
            }
        }
        this.setData({
            imgList:imgList
        })
    },
    getImgList:function(){
        wx.showLoading({
            title:"数据获取中",
            icon:"none"
        });
        var that=this;
        app.getOpenId(function(openid){
            var serverPath=app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH;
            var apiUrl=serverPath+"/api/images?page="+pageIndex+"&open_id="+openid;
            wx.request({
                url: apiUrl,
                method:"GET",
                success: function(res) {
                    console.log(res.data);


                    //需要数组拼接
                    var imgListOld=pageIndex>1?that.data.imgList:[];
                    var imgListNew= [];

                    imgListNew = res.data.map(function (item, i) {
                        return {
                            index: i,
                            userId: res.data[i].userId,
                            id: res.data[i].id,
                            path: serverPath + "/view/images/thumbs/thumb_" + res.data[i].path,
                            favorite: res.data[i].voted,
                            count: res.data[i].count,
                            original_img_path: serverPath + "/view/images/" + res.data[i].path
                        }
                    });

                    imgListOld = [...imgListOld, ...imgListNew];

                    // for(var i=0;i<res.data.length;i++){
                    //     // var userIdFromLocal=wx.getStorageSync('userId')||"";
                    //     // var votes=res.data[i].votes;
                    //     // var favorite=false;
                    //     // for(var j=0;j<votes.length;j++)
                    //     // {
                    //     //     if(votes[j].userId.toString()===userIdFromLocal.toString())
                    //     //     {
                    //     //         favorite=true;
                    //     //         break;
                    //     //     }
                    //     // }

                    //     imgListNew.push({
                    //         userId:res.data[i].userId,
                    //         id:res.data[i].id,
                    //         path:serverPath+"/view/images/thumbs/thumb_"+res.data[i].path,
                    //         favorite:res.data[i].voted,
                    //         count:res.data[i].count,
                    //         original_img_path:serverPath+"/view/images/"+res.data[i].path
                    //     })
                    // }
                    // for(var i=0;i<imgListNew.length;i++)
                    // {
                    //     imgListOld.push(imgListNew[i]);
                    // }

                    that.setData({
                        imgList:imgListOld
                    });
                    pageIndex++;

                    if(imgListNew.length===0)
                    {
                        that.setData({
                            noData:true
                        })
                    }
                },
                fail:function(error){
                    console.error(error);
                },
                complete:function(){
                    wx.hideLoading();
                    wx.stopPullDownRefresh();
                }
            })
        });
    },
    onLoad:function(){
        this.getImgList();
        wx.showShareMenu({
            withShareTicket: true
        });
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if (this.data.noData ===false){
            this.getImgList();
        }
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        pageIndex=1;
        this.setData({
            noData:false
        })
        this.getImgList();
    }
});