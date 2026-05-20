param(
      [switch]$Execute
  )

  $ErrorActionPreference = "Stop"

  $raw = jumbo invariants list
  $data = $raw | ConvertFrom-Json

  if (-not $data.invariants) {
      throw "No invariants found in 'jumbo invariants list' output."
  }

  function Limit-Title {
      param([string]$Text)

      if ($Text.Length -le 60) {
          return $Text
      }

      return $Text.Substring(0, 57).TrimEnd() + "..."
  }

  foreach ($invariant in $data.invariants) {
      $title = Limit-Title "Audit TUI: $($invariant.title)"

      $objective = @"
Analyze the src/presentation/tui namespace for infractions of invariant '$($invariant.title)' and fix every confirmed violation within that namespace. Invariant description: $($invariant.description)
"@.Trim()

      $criteria = @(
          "All files under src/presentation/tui are reviewed against invariant '$($invariant.title)'.",
          "Every confirmed infraction in src/presentation/tui is fixed.",
          "Relevant tests are added or updated for changed TUI behavior.",
          "No changes are made outside src/presentation/tui except directly necessary mirrored tests or supporting types."
      )

      $args = @(
          "goal", "add",
          "--title", $title,
          "--objective", $objective,
          "--criteria"
      ) + $criteria + @(
          "--scope-in", "src/presentation/tui",
          "--scope-out", "unrelated namespaces outside src/presentation/tui"
      )

      if ($Execute) {
          Write-Host "Creating goal: $title"
          & jumbo @args
      }
      else {
          Write-Host "`nDRY RUN: jumbo $($args -join ' ')"
      }
  }

  if (-not $Execute) {
      Write-Host "`nDry run complete. Re-run with -Execute to create the goals."
  }
