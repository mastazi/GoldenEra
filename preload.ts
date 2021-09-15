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

  fingerPopulate().then((response) => {
    replaceText('finger', response);
  });
  gohperPopulate().then((response) => {
    replaceText('gopher', response);
  });
  geminiPopulate().then((response) => {
    replaceText('gemini', response);
  });
})

const fingerPopulate = async () => {
  const response = await fingerRequest('benbrown@happynetbox.com');
  return response.text();
}

const gohperPopulate = async () => {
  const response = await gopherRequest('gopher://cosmic.voyage:70/0/Aker/210207.txt');
  return response.text();
}

const geminiPopulate = async () => {
  const response = await geminiRequest('gemini://breadpunk.club/~bagel/songaweek.gmi');
  return response.text();
}

const fingerRequest = async (path: string): Promise<{ text: () => string }> => {
  return new Promise((resolve, reject) => {
    const [handle, host] = path.split(/@/);
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

