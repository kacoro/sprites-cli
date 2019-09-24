const fs = require('fs'),
path = require('path');
/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getStat(path){
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if(err){
                resolve(false);
            }else{
                resolve(stats);
            }
        })
    })
}
exports.getStat = getStat
/**
 * 创建路径
 * @param {string} dir 路径
 */
 function mkdir(dir){
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => {
            if(err){
                resolve(false);
            }else{
                resolve(true);
            }
        })
    })
}
exports.mkdir = mkdir
/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
async function dirExists(dir){
    let isExists = await getStat(dir);
    //如果该路径且不是文件，返回true
    if(isExists && isExists.isDirectory()){
        return true;
    }else if(isExists){     //如果该路径存在但是文件，返回false
        return false;
    }
    //如果该路径不存在
    let tempDir = path.parse(dir).dir;      //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await dirExists(tempDir);
    let mkdirStatus;
    if(status){
        mkdirStatus = await mkdir(dir);
    }
    return mkdirStatus;
}
exports.dirExists = dirExists

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
async function makeJson(dir){
    let isExists = await getStat(dir);
    //如果该路径且不是文件，返回true
    if(isExists && isExists.isDirectory()){
        return true;
    }else if(isExists){     //如果该路径存在但是文件，返回false
        return false;
    }
    //如果该路径不存在
    let tempDir = path.parse(dir).dir;      //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await dirExists(tempDir);
    let mkdirStatus;
    if(status){
        mkdirStatus = await mkdir(dir);
    }
    return mkdirStatus;
}
exports.makeJson = makeJson

//获取所有文件
function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function(itm, index) {
      var stat = fs.statSync(path + itm);
      if (stat.isDirectory()) {
        //递归读取文件
        // readFileList(path + itm + "/", filesList);
      } else {
        var obj = {}; //定义一个对象存放文件的路径和名字
        obj.path = path; //路径
        obj.filename = itm; //名字
        filesList.push(obj);
      }
    });
  }
  var getFiles = {
    //获取文件夹下的所有文件
    getFileList: function(path) {
      let filesList = [];
      readFileList(path, filesList);
      return filesList;
    },
    //获取文件夹下的所有图片
    getImageFiles: function(path) {
      let imageList = [];
      this.getFileList(path).forEach(item => {
        // var image = imageinfo(fs.readFileSync(item.path + item.filename));
        var mimeType = !/.(gif|jpg|jpeg|png|gif|jpg|png)$/.test(item)
        console.log(mimeType)
        mimeType && imageList.push(item.filename);
      });
      return imageList;
    }
  };

  exports.getFiles = getFiles