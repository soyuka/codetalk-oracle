module.exports = function(help) {
  if (process.argv.slice(2).filter(e => e.includes('help') || e === '-h').length === 0) {
    return
  }

  if (typeof help === 'string') {
    console.log(help)
    process.exit(2)
  }

  for (let i in help) {
    console.log(`
${i.toUpperCase()}:
  ${help[i]}`)
  }

  process.exit(2)
}
