"use client"

type Props = {
  message:string
}

export default function AIResponse({
  message
}:Props){

  if(!message) return null

  return (

    <div
      className="
      mt-5
      rounded-xl
      border
      border-purple-500/20
      bg-purple-500/5
      p-4
      "
    >

      <p className="
      text-xs
      text-purple-400
      mb-2
      ">
        NOXVEIL AI CORE
      </p>


      <p className="
      text-sm
      text-zinc-300
      ">
        {message}
      </p>

    </div>

  )
}