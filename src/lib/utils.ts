
  export async function toDataURL(urll: string): Promise<any> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", urll, true);
      xhr.onload = function(e) {
        const reader = new FileReader();
        reader.readAsDataURL(xhr.response);
        reader.onloadend = function() {
          resolve(reader.result);
        };
      };
      xhr.onerror = function() {
        resolve(undefined);
        console.error("** An error occurred during the XMLHttpRequest");
      };
      xhr.responseType = "blob";
      xhr.send();
    });
  }

  
  export const ignoreUrl = [
    "chrome:",
    "chrome-extension:",
    "javascript:",
    "file:",
    "data:",
  ];