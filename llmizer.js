import * as fs from 'fs/promises'
import path from 'path'

async function extractProjectFiles(projectPath, outputPath) {
  // Array di estensioni da processare
  const validExtensions = ['.ts', '.js', '.json', '.env', '.css', '.vue', '.html', '.md', '.scss', '.sass', '.txt']
  // Directory da escludere
  const excludedDirs = ['node_modules', 'dist', '.git', 'coverage', '.vscode', 'public', 'tests']
  const excludedFiles = [
    '.gitattributes',
    '.gitignore',
    '.prettierrc.json',
    'eslint.config.ts',
    'llmizer.js',
    'package-lock.json',
    'project-export.md',
    'README.md',
    'tsconfig.json',
    'env.d.ts',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'tsconfig.vitest.json',
    'vite.config.js',
    'vitest.config.ts',
    'vite.config.ts',
    'dirTree.js',
    'splitter.js',
    'llmizer.js',
    'ai_files',
    'compile_errors.txt',
    'config.yaml',
    'README.txt',
    'CHANGELOG.md',
    'LICENSE',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    'README.md'
  ]
  let output = ''

  async function processDirectory(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name)

      // Salta le directory escluse
      if (item.isDirectory() && excludedDirs.includes(item.name)) {
        continue
      }

      if (item.isDirectory()) {
        await processDirectory(fullPath)
      } else {
        const ext = path.extname(item.name)
        if (validExtensions.includes(ext) && !excludedFiles.includes(item.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8')
            const relativePath = path.relative(projectPath, fullPath)

            // Aggiungi intestazione con informazioni sul file
            output += `**Path**: ${fullPath}\n\n**Content**:\n${content}\n\n---\n\n`
          } catch (err) {
            console.error(`Errore nella lettura del file ${fullPath}:`, err)
          }
        }
      }
    }
  }

  try {
    // Aggiungi intestazione del progetto

    const readmeContent = await fs.readFile(path.join(projectPath, 'README.md'), 'utf8').catch(() => null)
    if (readmeContent)
        output += `${readmeContent}\n\n`;
    else {
        output += `# ${process.cwd().split('/').at(-1)} Project Code Export\n\n`
        output += `Generated on: ${new Date().toISOString()}\n\n`
    }

    output += `---\n\n## Project Files:\n\n`;


    await processDirectory(projectPath)
    fs.writeFile(outputPath, output)
    console.log(`Export completato con successo in: ${outputPath}`)
  } catch (err) {
    console.error("Errore durante l'elaborazione:", err)
  }
}

// Esempio di utilizzo
const projectPath = process.argv[2] || './'
const outputPath = process.argv[3] || './project-export.md'

extractProjectFiles(projectPath, outputPath).catch(console.error)