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
  showWebcam?: boolean
  showMediaStatus?: boolean
  disabled?: boolean
}

const InterviewFooter = ({ 
  buttonText, 
  onButtonClick, 
  showNote = true,
  noteText = "Not: Sayfayı yenilemeyin, aksi halde verileriniz kaybolur.",
  showWebcam = false,
  showMediaStatus = true,
  disabled = false
}: InterviewFooterProps) => {
  return (
    <div className="interview-footer">
      <div className="interview-footer__action">
        <Button onClick={onButtonClick} disabled={disabled}>{buttonText}</Button>
      </div>
      
      {showNote && (
        <p className="interview-footer__note">{noteText}</p>
      )}
      
      {(showMediaStatus || showWebcam) && (
        <div className="interview-footer__media">
          {showMediaStatus && <MediaStatusIndicator />}
          {showWebcam && <WebcamPreview />}
        </div>
      )}
    </div>
  )
}

export default InterviewFooter
