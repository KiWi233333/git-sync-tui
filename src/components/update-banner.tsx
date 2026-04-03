import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { checkForUpdate } from '../utils/update-check.js'
import type { UpdateInfo } from '../utils/update-check.js'

interface UpdateBannerProps {
  currentVersion: string
}

export function UpdateBanner({ currentVersion }: UpdateBannerProps) {
  const [info, setInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    checkForUpdate(currentVersion).then((result) => {
      if (!cancelled && result.hasUpdate) {
        setInfo(result)
      }
    })
    return () => { cancelled = true }
  }, [currentVersion])

  if (!info) return null

  return (
    <Box marginTop={1}>
      <Text color="yellow">
        {'💡 '}新版本可用 <Text bold color="green">{info.latest}</Text>
        <Text color="gray">{' (当前 '}{info.current}{')'}</Text>
        <Text color="cyan">{` → ${info.updateCommand}`}</Text>
      </Text>
    </Box>
  )
}
