package expo.modules.navnotification

import android.content.Context
import android.os.Build
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record


class NavGuidanceRecord : Record {
  @Field var turnType: String? = null
  @Field var instruction: String? = null
  @Field var distanceLabel: String? = null
  @Field var nextInstruction: String? = null
  @Field var progress: Double = 0.0
  @Field var status: String? = null
  @Field var hasArrived: Boolean = false

  // Libellés que la notification compose elle-même, fournis traduits par le JS
  // (services/navigationNotification.js). Les valeurs par défaut sont les textes
  // français d'origine : un binaire à jour reste compatible avec un bundle qui ne
  // les enverrait pas encore.
  @Field var arrivedTitle: String = "Vous êtes arrivé !"
  @Field var rerouteTitle: String = "Recalcul de l'itinéraire…"
  @Field var fallbackTitle: String = "Navigation"
  @Field var nextPrefix: String = "Ensuite :"
}

/** Libellés fixés à l'ouverture du canal, avant toute mise à jour de guidage. */
class NavLabelsRecord : Record {
  @Field var channelName: String = "Navigation"
  @Field var startingInstruction: String = "Navigation en cours"
  @Field var startingDistanceLabel: String = "Calcul du guidage…"
}

class NavNotificationModule : Module() {
  companion object {
    private const val CHANNEL_ID = "navigation-guidance"
    private const val NOTIFICATION_ID = 42_100
    private const val ACCENT_COLOR = 0xFF646CFF.toInt()
    private const val PROGRESS_MAX = 1000
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "Contexte React indisponible" }

  // Le nom du canal est posé par start() puis réutilisé par chaque post() :
  // ensureChannel() est appelé aux deux endroits, et recréer le canal avec un
  // nom français écraserait celui que l'utilisateur voit dans les réglages
  // Android. Repli sur le français, comme les champs du record.
  private var channelName: String = "Navigation"

  override fun definition() = ModuleDefinition {
    Name("NavNotification")

    AsyncFunction("start") { labels: NavLabelsRecord ->
      channelName = labels.channelName
      ensureChannel()
      val initial = NavGuidanceRecord().apply {
        instruction = labels.startingInstruction
        distanceLabel = labels.startingDistanceLabel
      }
      post(initial)
    }

    AsyncFunction("update") { guidance: NavGuidanceRecord ->
      post(guidance)
    }

    AsyncFunction("stop") {
      NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }
  }

  private fun ensureChannel() {
    val channel = NotificationChannelCompat.Builder(
      CHANNEL_ID,
      NotificationManagerCompat.IMPORTANCE_LOW,
    )
      .setName(channelName)
      .setSound(null, null)
      .setVibrationEnabled(false)
      .setShowBadge(false)
      .build()
    NotificationManagerCompat.from(context).createNotificationChannel(channel)
  }

  private fun post(g: NavGuidanceRecord) {
    ensureChannel()

    val title: String
    val text: String
    when {
      g.hasArrived -> {
        title = g.arrivedTitle
        text = ""
      }
      g.status == "off_route" -> {
        title = g.rerouteTitle
        text = ""
      }
      else -> {
        title = g.instruction?.takeIf { it.isNotBlank() } ?: g.fallbackTitle
        text = listOfNotNull(
          g.distanceLabel?.takeIf { it.isNotBlank() },
          g.nextInstruction?.takeIf { it.isNotBlank() }?.let { "${g.nextPrefix} $it" },
        ).joinToString(" • ")
      }
    }

    val progress = (g.progress.coerceIn(0.0, 1.0) * PROGRESS_MAX).toInt()

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(iconFor(g))
      .setContentTitle(title)
      .setContentText(text)
      .setColor(ACCENT_COLOR)
      .setColorized(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSound(null)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
      .setProgress(PROGRESS_MAX, progress, false)

    if (text.isNotEmpty()) {
      builder.setStyle(NotificationCompat.BigTextStyle().bigText(text))
    }

    applyStatusBarChip(builder, g)

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build())
    } catch (_: SecurityException) {

    }
  }

  private fun applyStatusBarChip(builder: NotificationCompat.Builder, g: NavGuidanceRecord) {
    if (Build.VERSION.SDK_INT < 36) return
    val shortText = g.distanceLabel?.takeIf { it.isNotBlank() }
      ?: g.instruction?.takeIf { it.isNotBlank() }
      ?: return
    try {
      builder.javaClass
        .getMethod("setShortCriticalText", CharSequence::class.java)
        .invoke(builder, shortText)
    } catch (_: Throwable) {
    }
    try {
      builder.javaClass
        .getMethod("requestPromotedOngoing", Boolean::class.javaPrimitiveType)
        .invoke(builder, true)
    } catch (_: Throwable) {
    }
  }

  private fun iconFor(g: NavGuidanceRecord): Int {
    if (g.hasArrived) return R.drawable.ic_nav_arrive
    if (g.status == "off_route") return R.drawable.ic_nav_reroute
    return when (g.turnType) {
      "depart" -> R.drawable.ic_nav_depart
      "continue" -> R.drawable.ic_nav_continue
      "slight_left" -> R.drawable.ic_nav_slight_left
      "slight_right" -> R.drawable.ic_nav_slight_right
      "turn_left" -> R.drawable.ic_nav_turn_left
      "turn_right" -> R.drawable.ic_nav_turn_right
      "sharp_left" -> R.drawable.ic_nav_sharp_left
      "sharp_right" -> R.drawable.ic_nav_sharp_right
      "u_turn" -> R.drawable.ic_nav_uturn
      "roundabout" -> R.drawable.ic_nav_roundabout
      "arrive" -> R.drawable.ic_nav_arrive
      else -> R.drawable.ic_nav_continue
    }
  }
}
