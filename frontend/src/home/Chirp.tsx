import { PostChirp } from "../App"
import Vote from "../boards/Vote"


interface ChirpProps extends PostChirp {
    pinned?: boolean
    userColor: string
}

function Chirp(props: ChirpProps) {
    return (<li className={`w-full relative mt-8`}>
        
            <div className="block bg-black/10 text-white p-1 rounded-tr-xl border border-b-0 truncate border-black ">
                <a href={`/profile/${props.authorUsername}`} className="text-xs ml-2 inline" style = {{color: props.userColor}}>
                    {props.authorDisplayName}
                </a>
                <a href={`/profile/${props.authorUsername}`} className="text-xs m-0 inline h-fit"> 
                    {` • @${props.authorUsername}`} 
                </a>
                <div className="text-xs inline"> {` • ${props.postDate}`} </div>
            </div>

            <a href={`/board/${props.id}`} className = "scroll">
                <div className={`w-full max-h-96 overflow-y-auto whitespace-pre relative p-6 pt-3 border-black border border-t-0 rounded-bl-xl break-all text-white ${props.pinned ? "bg-rose-400/25" : "bg-black/10" }`}>
                    {props.text}
                </div>
            </a>
        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp