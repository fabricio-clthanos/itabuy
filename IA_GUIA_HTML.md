# Guia de Criação de Conteúdo HTML (ItaBuy)

Este guia deve ser utilizado ao solicitar que uma IA gere código HTML para banners e páginas personalizadas da loja ItaBuy. Siga estas diretrizes para garantir que o design seja moderno, responsivo e funcional.

## 🎨 Estilo Visual
- **Tipografia:** Use `font-family: 'Space Grotesk', sans-serif;` para títulos e `'Inter', sans-serif;` para textos.
- **Cores:** Fundo branco (`#ffffff`) ou cinza muito claro (`#f8fafc`). Textos em grafite escuro (`#0f172a`). Acentos em azul (`#2563eb`) ou amarelo marca (`#facc15`).
- **Bordas:** Use `border-radius: 1rem;` para cartões e botões.

## 📱 Responsividade (Mobile 100%)
- Todo o conteúdo deve ser contido em um container principal com `width: 100%;` e `max-width: 500px;` (ideal para mobile).
- Use `box-sizing: border-box;` em todos os elementos.
- Evite larguras fixas em pixels (use `%`, `vw` ou `rem`).

## 🤖 Integração com IA (Funções Disponíveis)
O site injeta automaticamente funções globais que você pode chamar via `onclick`.
- `gerar()`: Gera uma dica/conselho.
- `desafio()`: Gera um desafio interativo.
- `curiosidade()`: Gera uma curiosidade interessante.
- `abrirCapsula()`: Gera uma mensagem surpresa mágica.

**IMPORTANTE:** Para que o resultado dessas funções apareça na tela, seu HTML deve conter um elemento com um destes IDs:
`id="resultado"`, `id="dica"`, `id="desafio"`, `id="curiosidade"`, ou `id="output"`.

## 🛠️ Exemplo de Estrutura Recomendada

```html
<div style="font-family: sans-serif; padding: 20px; text-align: center; background: #fff;">
  <h2 style="font-size: 1.5rem; font-weight: 800; text-transform: uppercase; color: #0f172a;">
    Cápsula do Tempo
  </h2>
  
  <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 20px;">
    Toque no botão para receber uma mensagem mágica do futuro!
  </p>

  <div id="output" style="min-height: 50px; padding: 15px; background: #f1f5f9; border-radius: 12px; margin-bottom: 20px; font-weight: 600; color: #1e293b;">
    Aguardando seu toque...
  </div>

  <button onclick="abrirCapsula()" style="width: 100%; border: none; padding: 15px; background: #0f172a; color: #fff; font-weight: 800; border-radius: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
    Abrir Cápsula 🚀
  </button>
</div>
```

## ⚠️ Restrições
- Não use `alert()` ou `prompt()`.
- Não tente importar bibliotecas externas pesadas.
- Mantenha o CSS inline para garantir que o estilo seja aplicado corretamente dentro do componente.
