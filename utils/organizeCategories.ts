export const organizeCategories = (flatCategories: any[]) => {
  const result: any[] = []
  const addedIds = new Set()

  const findChildren = (parentId: number, level: number) => {
    const children = flatCategories.filter((c) => c.parent === parentId)

    children.forEach((child) => {
      const indent = "\u00A0\u00A0".repeat(level)
      const prefix = level > 0 ? "— " : ""

      result.push({
        ...child,
        displayName: `${indent}${prefix}${child.name}`
      })

      addedIds.add(child.id)

      findChildren(child.id, level + 1)
    })
  }

  findChildren(0, 0)

  flatCategories.forEach((cat) => {
    if (!addedIds.has(cat.id)) {
      result.push({
        ...cat,
        displayName: cat.name
      })
    }
  })

  return result
}
