const express = require('express')
const cors = require('cors')
const fs = require('fs-extra')
const path = require('path')

// 生成并确保临时文件夹存在
const TEMP_DIR = path.resolve(__dirname,'temp');
fs.ensureDir(TEMP_DIR);

const app = express()

// 允许跨域
app.use(cors());

app.post("/upload/:filename",async(req,res)=>{
    const {filename} = req.params;
    console.log(req.params)
    const filePath = path.resolve(TEMP_DIR,filename);
    console.log(filePath,"filename")
    const ws = fs.createWriteStream(filePath);
    await pipeStream(req,ws);
    res.json({success:true})
})

app.listen(8080,()=>{
    console.log('server is running on port 8080');
})

/**
 *  数据流从可读流流向可写流
 *     re 可读流
 *     ws 可写流
 * 返回一个promise 当流结束时,promise 会被 reseolve
 * 
*/
function pipeStream(rs,ws){
    return new Promise((resolve,reject)=>{
        rs.pipe(ws).on("finish",resolve).on("error",reject)
    })
}
