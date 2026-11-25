const imagekit = require("@imagekit/nodejs");


const imageKitClient = new imagekit({
    privateKey : process.env.Private_key,
})


async function uploadFile(buffer){

  const res = await imageKitClient.files.upload({
    file: buffer.toString("base64"),
    fileName: "images",
  })
  return res;
  
}

async function deleteFile(fileId) {
     const res = await imageKitClient.files.delete(fileId);
     return res;
}

async function updateFile(fileId, buffer) {
    const img = await uploadFile(buffer);

    if(fileId) {
        await deleteFile(fileId);
    }

    return img;

}


module.exports = { uploadFile, deleteFile, updateFile};