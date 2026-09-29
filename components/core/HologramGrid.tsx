"use client"

import { motion } from "framer-motion"


export default function HologramGrid(){

return(

<div
className="
pointer-events-none
absolute
inset-0
overflow-hidden
"
>


{/* Horizon Glow */}

<div
className="
absolute
left-1/2
top-1/2
h-96
w-96
-translate-x-1/2
-translate-y-1/2
rounded-full
bg-cyan-500/10
blur-3xl
"
/>



{/* 3D Grid */}

<motion.div

animate={{
y:[0,40]
}}

transition={{

duration:8,
repeat:Infinity,
ease:"linear"

}}

className="
absolute
left-0
right-0
bottom-0
h-[55%]
origin-bottom
rotate-x-[65deg]
"

>


<div
className="
h-full
w-full
bg-[linear-gradient(rgba(34,211,238,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.18)_1px,transparent_1px)]
bg-[size:45px_45px]
"
/>


</motion.div>



{/* Scan Lines */}

<motion.div

animate={{

y:[
"-100%",
"200%"
]

}}

transition={{

duration:5,
repeat:Infinity,
ease:"linear"

}}

className="
absolute
left-0
right-0
h-24
bg-gradient-to-b
from-transparent
via-cyan-400/10
to-transparent
"

/>



</div>

)

}