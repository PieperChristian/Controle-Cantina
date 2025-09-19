import 'dotenv/config'
import express from 'express'
const app = express()
const port = 3000

import candidatasRoutes from "./routes/candidatas.js"
import clientesRoutes from "./routes/clientes.js"
import votosRoutes from "./routes/votos.js"

app.use(express.json())  // middleware para aceitar dados no formato JSON

app.use("/candidatas", candidatasRoutes)
app.use("/clientes", clientesRoutes)
app.use("/votos", votosRoutes)

app.get('/', (req, res) => {
  res.send('API: Cadastro de Candidatas, Clientes e Votos')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})
