import Image from 'next/image'

export function PFDALogo() {
  return (
    <Image
      src="/pfdaalogo.webp"
      alt="PFDA Logo"
      width={64}
      height={64}
      priority
      className="w-16 h-16"
    />
  )
}
