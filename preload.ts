const net = require('net');
const gopherLib = require('gopher-lib');
const gopher = new gopherLib.Client();
const gemini = require('gemini-fetch')({
  followRedirects: true,
  useClientCerts: true
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  const replaceHtml = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerHTML = text
  }

  const urlBarButton = document.querySelector('#url-bar-btn');

  const urlBarInput: HTMLInputElement | null = document.querySelector('#url-bar-input');

  const submitRequest = (url: string) => {
    if (url.includes('gopher://')) {
      gohperPopulate(url).then((response) => {
        replaceHtml('content-area', response);
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

  urlBarInput?.addEventListener('keydown', (ev) => {
    if (isKeyboardEvent(ev)) {
      if (ev.code === 'Enter') {
        const url = urlBarInput?.value;
        if (url) {
          submitRequest(url);
        }
      }
    }
  });
})

const isKeyboardEvent = (event: Event): event is KeyboardEvent => {
  return true;
}

const gopherSelectorClean = (selector: string) => {
  return selector.replace(/\\/g, '/');
}

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
        if (reply.text) {
          console.log(reply.text)
          resolve({ text: () => { return reply.text.replace(/(?:\r\n|\r|\n)/g, '<br>') } });
        }
        if (reply.directory) {
          console.log(reply.directory)
          let dirText = '';
          for (const line of reply.directory) {
            if (line.type === 'i') {
              dirText += `${line.name}<br>`;
            } else if (line.type === '0' || line.type == '1') {
              dirText += `<a href="gopher://${line.host}:${line.port}${gopherSelectorClean(line.selector)}${line.query ? '?' + line.query : ''}">${line.name}</a><br>`
            } else if (line.type === 'g' || line.type == 'I' || line.type == '9' || line.type == '5' || line.type == 'd' || line.type == 's') {
              dirText += `FILE ${line.type} => "gopher://${line.host}:${line.port}${gopherSelectorClean(line.selector)}${line.query ? '?' + line.query : ''}" ${line.name}<br>`
            } else if (line.type === 'h') {
              dirText += `=> ${gopherSelectorClean(line.selector).replace('URL:', '')} ${line.name}<br>`
            } else {
              dirText += `UNKNOWN: type ${line.type} => "${line.host}:${line.port}${gopherSelectorClean(line.selector)}" ${line.name}<br>`
            }
          }
          resolve({ text: () => { return dirText } });
        }
        if (reply.buffer) {
          console.error('buffer type not supported')
          reject;
        }
      }
    });
  })
}

const geminiRequest = async (path: string) => {
  return gemini(path);
}

