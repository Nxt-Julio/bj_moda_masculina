# Padrao de Imagens - BJ Moda Social Masculina

## Objetivo
Padronizar captura, nome, compressao e upload de imagens para manter o site rapido e com visual premium.

## Fluxo mais rapido (celular -> site)
1. Tire foto no celular em boa luz.
2. Exporte para JPG (qualidade alta, nao original maxima).
3. Renomeie no padrao abaixo.
4. Envie no painel admin (botao "Enviar para Cloudinary").
5. Confirme se a URL foi preenchida no campo `image_url`.
6. Salve o produto.

## Formatos recomendados
- Produto: JPG (principal), WEBP (ideal no Cloudinary), PNG so quando precisar de transparencia.
- Logo/selo: PNG ou SVG.
- Nao usar HEIC no site.

## Tamanhos recomendados
- Hero/banner: 1920x1080 (16:9), ate 500 KB.
- Produto vertical: 1000x1250 (4:5), ate 250 KB.
- Miniatura: 600x750 (4:5), ate 120 KB.

## Convencao de nomes
Use tudo minusculo, sem espacos e sem acentos.

Padrao:
`categoria-produto-cor-codigo-v01.jpg`

Exemplos:
- `gravata-listra-azul-gv001-v01.jpg`
- `kit-social-azul-dourado-kt004-v01.jpg`
- `abotoadura-classica-prata-ab010-v01.jpg`

## Checklist de qualidade
- Fundo limpo e iluminacao uniforme.
- Produto centralizado.
- Sem marcas d'agua de apps.
- Nitidez boa ao ampliar.
- Mesmo padrao de enquadramento entre produtos.

## Observacoes de producao
- Em producao, manter imagens no Cloudinary e salvar apenas URL no banco.
- Evitar guardar arquivos de imagem no servidor da aplicacao.
