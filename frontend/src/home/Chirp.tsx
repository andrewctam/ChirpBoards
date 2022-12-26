interface ChirpProps {
    author: string
    text: string
    date: string
}

function Chirp(props: ChirpProps) {
    return (<li>
            <a href = "./board">
                <div className = "w-full mt-16 mb-4 p-10 pb-4 border border-black rounded-xl bg-slate-300 relative break-all">
                    <a href = "./profile" className = "absolute -top-8 left-2 bg-white text-black rounded-xl p-2 border border-black">
                        {props.author}
                        <div className = "text-xs">
                            {` on  ${props.date}`} 
                        </div>
                    </a>

                    {props.text}
                </div>
            </a>
        </li>
    )


}


export default Chirp