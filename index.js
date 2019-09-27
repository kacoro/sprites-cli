#!/usr/bin/env node
// sprites-cli

const program = require("commander"), 
// csv = require("csv"),
chalk = require("chalk"),
inquirer = require("inquirer"),
Jimp = require("Jimp"),
path = require('path'),
fs = require("fs"),
{ getFiles } = require('./utils/dir');

var imgMetadataList = [];
var maxWidth = 0;
var maxHeight = 0;
var padding = 0;
var targetName = 'sprites'
var blankImage= {
  path:path.join(__dirname,"./blank.png"),
  target:targetName+".png",
  image:null,
  width:0,
  height:0
} ;

program
  .version("1.0.1")
  .option("-t, --test [type]", "set source and target directory to ./test/")
  .option("-s, --set [type]", "set source and target  by user input")
  .option("-d, --drop [type]", "drop blac background")
  .option("-p, --padding [value]", "set the padding output, default is 0")
  .option("-n, --name [value]", "set the output name, default is sprites")
  .parse(process.argv);

const questions = [
  {
    type: "input",
    name: "form.input",
    message: "input the images directory: "
  },
  {
    type: "input",
    name: "form.output",
    message: "input the output directory: "
  }
];

var str = ''
var htmlStr = ''
var cssStr = ''
var frame = [];
function makeJson(source,x,y,i,j){
  var reg = /\.*?(bmp|gif|png|jpg|jpeg)/gi;
  var name = source.name.replace(reg, '');
  var tpl = `"${name}":{
    "frame": {"x":${maxWidth * i},"y":${maxHeight * j},"w":${maxWidth},"h":${maxHeight}},
   "rotated": false,
    "trimmed": true,
    "spriteSourceSize": {"x":0,"y":0,"w":${source.bitmap.width},"h":${source.bitmap.height}},
    "sourceSize": {"w":${source.bitmap.width},"h":${source.bitmap.height}},
    "pivot": {"x":0,"y":0}
    }`
    return tpl;
}

function makeHtml(index){
  var tpl = `
    <div class="icon-${targetName} icon-${targetName}-${index}">
    </div>
  `
  return tpl
}

function makeCss(index,i,j){
  var tpl = `
    .icon-${targetName}-${index}{
        background-position:-${maxWidth * i}px -${maxHeight * j}px;
    }
  `
  return tpl
}

const generation = async form => {
  const start = new Date();
  const inputPath = form.input || "./";
  const outputPath = form.output || "./";
  const input = chalk.green(`${inputPath}`);
  const output = chalk.green(`${outputPath + blankImage.target}`);
  console.log(`images directory is :${input} `); //
  let imageList = getFiles.getImageFiles(inputPath);
  for (const name of imageList) {
    const column = await Jimp.read(inputPath + name)
      .then(image => {
        image.name = name
        imgMetadataList.push(image);
        maxHeight = Math.max(maxHeight, image.bitmap.height);
        maxWidth = Math.max(maxWidth, image.bitmap.width);
        const { height, width } = image.bitmap;
        console.log(`load ${name} success，pixel is：${height}x${width}`);
        // Do stuff with the image.
      })
      .catch(err => {
        // Handle an exception.
      });
  }
  var sqrt = Math.ceil(Math.sqrt(imgMetadataList.length));
  maxWidth += padding;
  maxHeight += padding;
  await Jimp.read(blankImage.path).then(images => {
    console.log(maxWidth * sqrt, maxHeight * sqrt);
    var num = sqrt;
    // if(imgMetadataList.length < sqrt*sqrt){
    //   num --
    // }
    blankImage.image = images.contain(maxWidth * sqrt, maxHeight * num);
  });
 
  var i = 0,
    j = 0,
    x = 0,
    y = 0;
  imgMetadataList.map((item, index) => {
    // 是否居中
    x = maxWidth * i + (maxWidth - item.bitmap.width) /2;
    y = maxHeight * j + (maxHeight - item.bitmap.height) /2;
   
   if(index == imgMetadataList.length-1){
    str += makeJson(item,x,y,i,j) 
   }else{
    str += makeJson(item,x,y,i,j)+','
   }
    htmlStr += makeHtml(index)
    cssStr += makeCss(index,i,j)
    blankImage.image.composite(item, x, y);//拼接图片
    i++;
    if (i+1 > sqrt) {
      i = 0;
      j++;
    }
  });
  //去除背景
  if(program.drop == true){
    const targetColor = {r: 0, g: 0, b: 0, a: 255};  // Color you want to replace
    const replaceColor = {r: 0, g: 0, b: 0, a: 0};  // Color you want to replace with
    const colorDistance = (c1, c2) => Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2) + Math.pow(c1.a - c2.a, 2));  // Distance between two colors
    const threshold = 32;  // Replace colors under this threshold. The smaller the number, the more specific it is.
    blankImage.image.scan(0, 0, blankImage.image.bitmap.width, blankImage.image.bitmap.height, (x, y, idx) => {
      const thisColor = {
        r: blankImage.image.bitmap.data[idx + 0],
        g: blankImage.image.bitmap.data[idx + 1],
        b: blankImage.image.bitmap.data[idx + 2],
        a: blankImage.image.bitmap.data[idx + 3]
      };
      if(colorDistance(targetColor, thisColor) <= threshold) {
        blankImage.image.bitmap.data[idx + 0] = replaceColor.r;
        blankImage.image.bitmap.data[idx + 1] = replaceColor.g;
        blankImage.image.bitmap.data[idx + 2] = replaceColor.b;
        blankImage.image.bitmap.data[idx + 3] = replaceColor.a;
      }
    }).write(outputPath + blankImage.target);
  }else{
    blankImage.image.write(outputPath + blankImage.target);
  }
  str = `
  {
    "frames": {${str}},
    "meta": {
      "app": "http://www.kacoro.com/",
      "version": "1.0.0",
      "image": "${blankImage.target}",
      "format": "RGBA8888",
      "size": {"w":${blankImage.image.bitmap.width},"h":${blankImage.image.bitmap.height}},
      "scale": "1",
      "smartupdate": ""
    }
  }
  `
  htmlStr = `
  <html>
  <head>
    <link rel="stylesheet" href="./${targetName}.css">
  </head>
    <body>
       ${htmlStr}
    </body>
  </html>
  `
  cssStr = `
    .icon-${targetName}{
       background:url("${targetName}.png") no-repeat;
       width:${maxWidth}px;
       height:${maxHeight}px;
       display:inline-block;
    }
    ${cssStr}
  `
  fs.writeFile(outputPath+ targetName+'.json',str,function(err){
    
  })
  fs.writeFile(outputPath+ targetName+'.html',htmlStr,function(err){
    
  })
  fs.writeFile(outputPath+ targetName+'.css',cssStr,function(err){
    
  })
  const ms = new Date() - start;
  console.log(
    `output : ${output},pixel is：${maxWidth * sqrt}x${maxHeight *
      sqrt}, finished ${ms}ms.`
  );
};


if(program.drop == true){

}
if(program.padding){
   padding = program.padding
}
if(program.name){
  targetName = program.name
  blankImage.target = program.name + '.png'
}
if (program.test == true) { //test的话直接引用
  console.log("test")
  generation({
    input: "./test/",
    output: "./test/output/"
  });
} else if(program.set == true) {
  inquirer
    .prompt(questions)
    .then(ans => {
      generation(ans.form);
    })
    .catch(err => {
      console.log(err);
    });
}else{
  generation({
    input: "./",
    output: "./output/"
  });
}

