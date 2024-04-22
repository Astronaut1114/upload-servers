const express = require('express')
const cors = require('cors')
const fs = require('fs-extra')
const path = require('path')

// 生成并确保临时文件夹存在
const TEMP_DIR = path.resolve(__dirname,'temp');

const UPLOADS_DIR = path.resolve(__dirname,"uploads")
fs.ensureDir(TEMP_DIR);
fs.ensureDir(UPLOADS_DIR);
const app = express()
const CHUNK_SIZE = 1024 * 1024 * 100
// 允许跨域
app.use(cors());

app.post("/upload/:filename",async(req,res)=>{
    // 获取文件名
    const {filename} = req.params;
    // 切片名
    const {chunkfilename} = req.query;
    // 拼接切片文件夹路径
    const chunkDir = path.resolve(TEMP_DIR,filename)
    // 确保切片文件夹存在
    await fs.ensureDir(chunkDir);
    // 拼接文件路径
    const chunkPath = path.resolve(chunkDir,chunkfilename)
    console.log(req.params)
    // const filePath = path.resolve(TEMP_DIR,filename);
    console.log(filePath,"filename")
    const ws = fs.createWriteStream(chunkPath);
    await pipeStream(req,ws);
    res.json({success:true})
})
// 合并切片儿
app.get("/merge/:filename", async(req, res) => {
    // 获取文件名
    const { filename } = req.params;
    // 拼接切片文件夹路径
    const chunkDir = path.resolve(TEMP_DIR, filename);
    // 读取切片文件夹中的文件名
    const chunks = await fs.readdir(chunkDir);
    if (chunks.length === 0) {
      res.json({ success: false, message: "切片文件不存在" });
      return;
    } else {
      // 按照切片的索引进行排序
      chunks.sort((a, b) => a.split("-")[0] - b.split("-")[0]);
      // 将合并的文件名路径
      const uploadsPath = path.resolve(UPLOADS_DIR, filename);
      // 写入文件的异步任务
      const writeTasks = chunks.map((chunkFilename, index) => {
        // 拼接切片文件夹路径
        const chunkPath = path.resolve(chunkDir, chunkFilename);
        // 创建可读流
        const rs = fs.createReadStream(chunkPath)
        // 创建可读流
        const ws = fs.createWriteStream(uploadsPath, {
          start: index * CHUNK_SIZE,
        });
        return pipeStream(rs, ws);
      });
      await Promise.all(writeTasks);
      // 合并完成后，删除切片文件夹
      await fs.rm(chunkDir, { recursive: true, force: true });
      return res.json({ success: true });
    }
  });
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
