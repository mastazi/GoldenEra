const net = require('net');
const gopherLib = require('gopher-lib');
const gopher = new gopherLib.Client();
const gemini = require('gemini-fetch')({
  followRedirects: true,
  useClientCerts: false
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  const urlBarButton = document.querySelector('#url-bar-btn');

  const urlBarInput: HTMLInputElement | null = document.querySelector('#url-bar-input');

  const submitRequest = (url: string) => {
    if (url.includes('gopher://')) {
      gohperPopulate(url).then((response) => {
        replaceText('content-area', response);
      })
    } else if (url.includes('gemini://')) {
      geminiPopulate(url).then((response) => {
        replaceText('content-area', response);
      })
    } else if (url.includes('finger://')) {
      fingerPopulate(url).then((response) => {
        replaceText('content-area', response);
      })
    } else if (url.includes('@')) {
      fingerPopulate(url).then((response) => {
        replaceText('content-area', response);
      })
    }
  }

  urlBarButton?.addEventListener('click', () => {
    const url = urlBarInput?.value;
    if (url) {
      submitRequest(url);
    }
  });
})



const fingerPopulate = async (url: string) => {
  const response = await fingerRequest(url);
  return response.text();
}

const gohperPopulate = async (url: string) => {
  const response = await gopherRequest(url);
  return response.text();
}

const geminiPopulate = async (url: string) => {
  const response = await geminiRequest(url);
  return response.text();
}

const fingerRequest = async (path: string): Promise<{ text: () => string }> => {
  return new Promise((resolve, reject) => {
    const fingerPath = path.replace('finger://', '');
    const [handle, host] = fingerPath.split(/@/);
    const [hostname, port] = host.split(/:/);
    const socket = net.connect(port ?? 79, hostname);
    let text = '';
    socket.on('connect', () => {
      socket.write(`${handle}\r\n`);
    });
    socket.on('data', (data: string) => {
      text = text + data;
    })
    socket.on('end', () => {
      resolve({ text: () => { return text; } });
    });
    socket.on('error', (error: any) => {
      console.log(`Error: ${error}`);
      reject;
    });
  });
}

const gopherRequest = async (path: string): Promise<{ text: () => string }> => {
  return new Promise((resolve, reject) => {
    gopher.get(path, (err: string, reply: any) => {
      if (err) {
        console.error(err);
        reject;
      } else {
        console.log(reply.text)
        resolve({ text: () => { return reply.text } });
      }
    });
  })
}

const geminiRequest = async (path: string) => {
  return gemini(path);
}

