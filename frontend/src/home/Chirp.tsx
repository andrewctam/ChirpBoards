interface ChirpProps {
    id: string
    authorUsername: string
    text: string
    postDate: string
}

function Chirp(props: ChirpProps) {
    return (<li>
            <a href = {`./board/${props.id}`}>
                <div className = "w-full mt-16 mb-4 p-10 pb-4 border border-black rounded-xl bg-slate-300 relative break-all">
                    <a href = "./profile" className = "absolute -top-8 left-2 bg-white text-black rounded-xl p-2 border border-black">
                        {props.authorUsername}
                        <div className = "text-xs"> {props.postDate} </div>
                    </a>

                    {props.text}
                </div>
            </a>
        </li>
    )


}


export default Chirp