import React from 'react'
import Button from '../Button'
import MediaStatusIndicator from '../MediaStatusIndicator'
import WebcamPreview from '../WebcamPreview'
import './interview-footer.styles.scss'

interface InterviewFooterProps {
  buttonText: string
  onButtonClick: () => void
  showNote?: boolean
  noteText?: string
}

const InterviewFooter = ({ 
  buttonText, 
  onButtonClick, 
  showNote = true,
  noteText = "Note : Do not refresh the page or you'll lose your data"
}: InterviewFooterProps) => {
  return (
    <div className="interview-footer">
      <div className="interview-footer__action">
        <Button onClick={onButtonClick}>{buttonText}</Button>
      </div>
      
      {showNote && (
        <p className="interview-footer__note">{noteText}</p>
      )}
      
      <div className="interview-footer__media">
        <MediaStatusIndicator />
        <WebcamPreview />
      </div>
    </div>
  )
}

export default InterviewFooter
