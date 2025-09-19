import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

const router = Router()

const votoSchema = z.object({
  clienteId: z.number(),
  candidataId: z.number(),
  justificativa: z.string().optional()
})

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.TRANSPORT_USER!,
    pass: process.env.TRANSPORT_PASS!,
  },
});

async function enviaEmail(
  email: string,
  cliente: string,
  candidata: string) {

    let mensagem = "<h2>Concurso Rainha da Fenadoce</h2>"
    mensagem += `<h3>Estimado Sr(a). ${cliente}</h3>`
    mensagem += "<h3>Muito obrigado por participar . . .</h3>"
    mensagem += `<h3>Você votou na candidata: ${candidata}</h3>`

    const info = await transporter.sendMail({
      from: "Consuro Rainha da Fenadoce (rainha@gmail.com)",
      to: email,
      subject: "Voto na Rainha da Fenadoce",
      text: "Obrigado por votar . . .", // plain‑text body
      html: mensagem, // HTML body
    })
  }

router.get("/", async (req, res) => {
  try {
    const votos = await prisma.voto.findMany({
      include: {
        cliente: true,
        candidata: true
      }
    })
    res.status(200).json(votos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = votoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { clienteId, candidataId, justificativa } = valida.data

  const dadosCliente = await prisma.cliente.findUnique({
    where: {id: clienteId}
  })

  const dadosCandidata = await prisma.candidata.findUnique({
    where: {id: candidataId}
  })

  // envia e-mail com 
  enviaEmail(
    dadosCliente?.email as string,
    dadosCliente?.nome as string,
    dadosCandidata?.nome as string
  )

  try {
    const [voto, candidata] = await prisma.$transaction([
      prisma.voto.create({
        data: justificativa == undefined ?
              { clienteId, candidataId } :
              { clienteId, candidataId, justificativa }
      }),
      prisma.candidata.update({
        where: { id: candidataId },
        data: { numVotos: { increment: 1 } }
      })])
    res.status(201).json({ voto, candidata })
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: 'Código inválido' })
    return
  }

  try {
    const votoExcluido = await prisma.voto.findUnique({ where: { id } })

    const [voto, candidata] = await prisma.$transaction([
      prisma.voto.delete({ where: { id } }),
      prisma.candidata.update({
        where: { id: votoExcluido?.candidataId },
        data: { numVotos: { decrement: 1 } }
      })])
    res.status(200).json({ voto, candidata})
//    res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ erro: 'Voto não encontrado' })
      return
    }
    console.log(error)
    res.status(500).json({ erro: 'Erro ao excluir o voto' })
  }
})

export default router
