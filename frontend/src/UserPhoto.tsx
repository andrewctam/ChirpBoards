interface UserPhotoProps {
    url: string
    userColor: string
    size: number
}

const UserPhoto = (props: UserPhotoProps) => {

    if (props.url) {
        return <img src = {props.url} className = "inline rounded-full" style = {{width: props.size + "px", height: props.size + "px"}}/>
    } else {
        return (
            // default image based on user's color
            <svg xmlns="http://www.w3.org/2000/svg" 
                className = "inline border bg-black/50 rounded-full" 
                style={ {borderColor: props.userColor} }
                width={props.size} 
                height={props.size} 
                viewBox="0 0 24 24" fill="none" 
                stroke={props.userColor} 
                strokeWidth="1">

                <path d="M20 22v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="9" r="4" />
            </svg>
        )
    }

}

export default UserPhoto