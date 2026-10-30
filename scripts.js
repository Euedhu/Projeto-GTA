let nome = document.querySelector(".nome")
let personagem = document.querySelector(".personagem")


function escolherpersonagem(nomePersonagem, imagemPersonagem, corpersonagem) {
    console.log(nomePersonagem, imagemPersonagem)
    nome.textContent = nomePersonagem
    personagem.src = typeof imagemPersonagem === "string" ? imagemPersonagem : imagemPersonagem.src
    nome.style.color = corpersonagem
}

function removerFundoBranco(imagem) {
    const origem = typeof imagem === "string" ? imagem : imagem.src
    const imagemCarregada = new Image()
    imagemCarregada.crossOrigin = "anonymous"

    return new Promise((resolve, reject) => {
        imagemCarregada.onload = function () {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = imagemCarregada.naturalWidth
                canvas.height = imagemCarregada.naturalHeight
                const contexto = canvas.getContext("2d", { willReadFrequently: true })
                if (!contexto) throw new Error("Não foi possível processar a imagem.")

                contexto.drawImage(imagemCarregada, 0, 0)
                const imagemDados = contexto.getImageData(0, 0, canvas.width, canvas.height)
                const pixels = imagemDados.data
                const largura = canvas.width
                const altura = canvas.height
                const visitados = new Uint8Array(largura * altura)
                const fila = new Int32Array(largura * altura)
                let inicio = 0
                let fim = 0

                function pareceFundoBranco(indice) {
                    const posicao = indice * 4
                    const vermelho = pixels[posicao]
                    const verde = pixels[posicao + 1]
                    const azul = pixels[posicao + 2]
                    return Math.min(vermelho, verde, azul) >= 205 &&
                        Math.max(vermelho, verde, azul) - Math.min(vermelho, verde, azul) <= 35
                }

                function adicionarPixel(indice) {
                    if (!visitados[indice] && pareceFundoBranco(indice)) {
                        visitados[indice] = 1
                        fila[fim++] = indice
                    }
                }

                for (let x = 0; x < largura; x++) {
                    adicionarPixel(x)
                    adicionarPixel((altura - 1) * largura + x)
                }
                for (let y = 1; y < altura - 1; y++) {
                    adicionarPixel(y * largura)
                    adicionarPixel(y * largura + largura - 1)
                }

                while (inicio < fim) {
                    const indice = fila[inicio++]
                    const x = indice % largura
                    if (x > 0) adicionarPixel(indice - 1)
                    if (x < largura - 1) adicionarPixel(indice + 1)
                    if (indice >= largura) adicionarPixel(indice - largura)
                    if (indice < largura * (altura - 1)) adicionarPixel(indice + largura)
                }

                for (let indice = 0; indice < visitados.length; indice++) {
                    if (visitados[indice]) pixels[indice * 4 + 3] = 0
                }

                contexto.putImageData(imagemDados, 0, 0)
                resolve(canvas.toDataURL("image/png"))
            } catch (erro) {
                reject(erro)
            }
        }

        imagemCarregada.onerror = function () {
            reject(new Error("Não foi possível carregar a imagem gerada para remover o fundo."))
        }
        imagemCarregada.src = origem
    })
}

function lerFoto(foto) {
    // ALERTA - ESSA PARTE É CHATINHA, ENTÃO ME ACOMPANHA
    // TEM COISAS QUE VOCE NAO TEM QUE ENTENDER AGORA, SÓ FAZ
    // BOMBA, POMBA ? ANTES DE P e B é M
    // onchange() = quando mudar algo, faça algo
    // onclick() = quando clicar em algo, faça algo
    // onload() = quando carregar algo, faça algo
    // toda vez que eu tenho que ir no SERVIDOR - ASYNC / AWAIT 

    if (!foto || !foto.files || !foto.files[0]) return

    let leitor = new FileReader() // FileReader = Leitor de arquivos
    leitor.readAsDataURL(foto.files[0]) // readAsDataURL = fiz a leitura da foto, e transformei em URL (link)

    leitor.onload = async function () {
        try {
            let desenho = await puter.ai.txt2img(
                "Transforme a pessoa desta foto em um personagem de videogame: contorno preto grosso, cores vivas, meio corpo, mantendo o rosto parecido. Gere o personagem centralizado sobre um fundo branco puro, liso e uniforme, sem cenário, sem chão e sem sombra.",
                {
                    model: "gpt-image-2.5-flare",
                    provider: "openai",
                    input_image: leitor.result,
                    quality: "medium"
                }
            )

            const personagemSemFundo = await removerFundoBranco(desenho)
            escolherpersonagem("Você", personagemSemFundo, '#b9b604')
        } catch (erro) {
            let detalhes = erro && erro.error ? erro.error : erro
            let mensagem
            if (typeof detalhes === "string") {
                mensagem = detalhes
            } else {
                try {
                    mensagem = JSON.stringify(detalhes, null, 2)
                } catch {
                    mensagem = String(detalhes)
                }
            }
            console.error("Detalhes completos do erro ao gerar o personagem:", mensagem)
            alert(`Não foi possível gerar o personagem.\nDetalhes: ${mensagem || "erro sem detalhes"}`)
        }
    }
}
