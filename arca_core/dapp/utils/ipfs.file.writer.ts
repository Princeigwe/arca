const fs = require("fs");

export class IpfsFileWriter {
  
  async writeFile(filePath: string, jsonData: string) {
    fs.writeFile(filePath, jsonData, "utf8", (err: NodeJS.ErrnoException) => {
      if (err) {
        console.error("Error writing data to file:", err);
      } else {
        console.log("Data written to file successfully");
      }
    });
  }

  async cleanUpFile(filePath: string) {
    fs.unlink(filePath, (err: NodeJS.ErrnoException) => {
      if (err) {
        console.error("Error deleting file:", err)
      }
      else {
        console.log("File deleted successfully");
      }
    })
  }
}
