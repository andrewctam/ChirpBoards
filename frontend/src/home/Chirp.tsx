import { PostChirp } from "../App"
import Vote from "../boards/Vote"


interface ChirpProps extends PostChirp {
    pinned?: boolean
}

function Chirp(props: ChirpProps) {
    return (<li className={`w-full relative mt-16`}>
        <a href={`/profile/${props.authorUsername}`} className="absolute -top-8 left-2 z-10 bg-gray-300 text-black rounded-xl p-2 border border-black/20">
            {props.authorDisplayName}
            <div className="text-xs inline"> {`@${props.authorUsername}`} </div>
            <div className="text-xs"> {props.postDate} </div>
        </a>

        { props.pinned ?
        <div className="absolute -top-4 right-10 z-10 bg-gray-300 text-black text-sm rounded-xl p-2 border border-black/20">
            Pinned Post
        </div>
        : null}

        <a href={`/board/${props.id}`}>
            <div className={`w-full relative p-10 pb-8 border border-black rounded-xl break-all text-white ${props.pinned ? "bg-rose-400/25" : "bg-black/10" }`}>
                {props.text}
            </div>
        </a>

        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp