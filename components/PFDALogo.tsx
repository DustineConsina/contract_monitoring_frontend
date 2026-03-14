import Image from 'next/image'

export function PFDALogo() {
  return (
    <div className="bg-transparent">
      <Image
        src="/logo.png"
        alt="PFDA Logo"
        width={64}
        height={64}
        priority
        className="w-16 h-16 object-contain"
        style={{ backgroundColor: 'transparent' }}
      />
    </div>
  )
}
