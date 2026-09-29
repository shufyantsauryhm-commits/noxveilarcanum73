"use client"

export default function ParticleBackground() {
  return (
    <div className="
      pointer-events-none
      absolute
      inset-0
      overflow-hidden
    ">

      <div className="
        absolute
        left-1/2
        top-1/2
        h-96
        w-96
        -translate-x-1/2
        -translate-y-1/2
        rounded-full
        bg-purple-600/20
        blur-3xl
        animate-pulse
      "/>


      <div className="
        absolute
        -left-20
        top-20
        h-64
        w-64
        rounded-full
        bg-cyan-500/20
        blur-3xl
        animate-pulse
      "/>


      <div className="
        absolute
        -right-20
        bottom-10
        h-64
        w-64
        rounded-full
        bg-purple-500/20
        blur-3xl
        animate-pulse
      "/>


      <div className="
        absolute
        left-[15%]
        top-[20%]
        h-2
        w-2
        rounded-full
        bg-white
      "/>


      <div className="
        absolute
        right-[20%]
        top-[35%]
        h-1.5
        w-1.5
        rounded-full
        bg-cyan-400
      "/>


      <div className="
        absolute
        bottom-[25%]
        left-[40%]
        h-1
        w-1
        rounded-full
        bg-purple-400
      "/>

    </div>
  )
}