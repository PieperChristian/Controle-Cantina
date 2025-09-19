import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(10,
    { message: "Nome deve possuir, no mínimo, 10 caracteres" }),
  cpf: z.string().min(11, { message: "CPF deve possuir, no mínimo, 11 caracteres" }),
  email: z.string().min(10,
    { message: "E-mail, no mínimo, 10 caracteres" }),
  cidade: z.string(),
  dataNasc: z.string().refine(val => Number.isInteger(Date.parse(val)),
    { message: "Informe uma data válida no formato YYYY-MM-DD" }),
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        votos: true,
      }
    })
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }
  const { nome, cpf, email, cidade, dataNasc } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, cpf, email, cidade, dataNasc: new Date(dataNasc) }
    })
    res.status(201).json(cliente)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: 'Código inválido' })
    return
  }

  try {
    const cliente = await prisma.cliente.delete({
      where: { id }
    })
    res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ erro: 'Cliente não encontrado' })
      return
    }
    console.log(error)
    res.status(500).json({ erro: 'Erro ao excluir o cliente' })
  }
})

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: 'Código inválido' })
    return
  }

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }
  const { nome, cpf, email, cidade, dataNasc } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { nome, cpf, email, cidade, dataNasc: new Date(dataNasc) }
    })
    res.status(200).json(cliente)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ erro: 'Cliente não encontrado' })
      return
    }
    console.log(error)
    res.status(500).json({ erro: 'Erro ao alterar o cliente' })
  }
})

export default router
