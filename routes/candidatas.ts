import { Router } from "express"
import { PrismaClient, Escolaridades } from "@prisma/client"
import { z } from "zod"

const router = Router()
const prisma = new PrismaClient()

const candidataSchema = z.object({
  nome: z.string().min(10, {
    message: "Nome deve possuir, no mínimo, 10 caracteres"
  }),
  clube: z.string().min(3, {
    message: "Clube deve possuir, no mínimo, 3 caracteres"
  }),
  idade: z.number().min(16, {
    message: "Candidata deve possuir, no mínimo, 16 anos"
  }),
  escolaridade: z.enum(Escolaridades, {
    message: "Deve ser Médio, Graduação ou Pós_Graduação"
  }),
  sonho: z.string().min(20, {
    message: "Sonho deve possuir, no mínimo, 20 caracteres"
  })
})

router.get('/', async (req, res) => {
  try {
    const candidatas = await prisma.candidata.findMany()
    res.status(200).json(candidatas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ erro: 'Erro no Servidor...' })
  }
})

router.post("/", async (req, res) => {
  const result = candidataSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues })
    return
  }

  const { nome, clube, idade, escolaridade, sonho } = result.data

  try {
    const candidata = await prisma.candidata.create({
      data: { nome, clube, idade, escolaridade, sonho }
    })
    res.status(201).json(candidata)
  } catch (error) {
    console.log(error)
    res.status(500).json({ erro: 'Erro ao cadastrar a candidata' })
  }
})

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: 'Código inválido' })
    return
  }

  const result = candidataSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues })
    return
  }

  const { nome, clube, idade, escolaridade, sonho } = result.data

  try {
    const candidata = await prisma.candidata.update({
      where: { id },
      data: { nome, clube, idade, escolaridade, sonho }
    })
    res.status(200).json(candidata)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ erro: 'Candidata não encontrada' })
      return
    }
    console.log(error)
    res.status(500).json({ erro: 'Erro ao alterar a candidata' })
  }
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: 'Código inválido' })
    return
  }

  try {
    await prisma.candidata.delete({
      where: { id }
    })
    res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ erro: 'Candidata não cadastrada' })
      return
    }
    console.log(error)
    res.status(500).json({ erro: 'Erro ao excluir a candidata' })
  }
})

export default router