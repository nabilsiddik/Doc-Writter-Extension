export const getAmount = (price: string) => {
  return Math.floor(Number(price.replace(/[^\d.]/g, ""))).toString()
}
