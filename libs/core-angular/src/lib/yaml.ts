import yaml from 'js-yaml'

export function saveAsYaml(fileName: string, obj: any) {
  const content = yaml.dump(obj)

  // Create element with <a> tag
  const link = document.createElement('a')

  // Create a blog object with the file content which you want to add to the file
  const file = new Blob([content], { type: 'text/plain' })

  // Add file content in the object URL
  link.href = URL.createObjectURL(file)

  // Add file name
  link.download = fileName

  // Add click event to <a> tag to save file.
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function uploadYamlFile<T>(file) {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ((f) => {
      return (e) => {
        resolve(yaml.load(e.target.result as string) as T)
      }
    })(file)
  
    reader.readAsText(file, 'UTF-8')
  })
}
