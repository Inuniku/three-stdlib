import { Curve, Vector, Vector2, Vector3, Vector4 } from 'three'
import * as NURBSUtils from '../curves/NURBSUtils'

/**
 * NURBS curve object
 *
 * Derives from Curve, overriding getPoint and getTangent.
 *
 * Implementation is based on (x, y [, z=0 [, w=1]]) control points with w=weight.
 *
 */
class NURBSCurve extends Curve<Vector> {
  degree: number
  /** array of reals */
  knots: number[]

  controlPoints: Vector4[]

  /** index in knots */
  startKnot: number
  /** index in knots */
  endKnot: number

  constructor(
    degree: number,
    knots: number[],
    controlPoints: Array<Vector2 | Vector3 | Vector4>,
    startKnot: number,
    endKnot: number,
  ) {
    super()

    this.degree = degree
    this.knots = knots
    this.controlPoints = []
    // Used by periodic NURBS to remove hidden spans
    this.startKnot = startKnot || 0
    this.endKnot = endKnot || this.knots.length - 1
    for (let i = 0; i < controlPoints.length; ++i) {
      // ensure Vector4 for control points
      const point = controlPoints[i]
      const z = point instanceof Vector3 ? point.z : undefined
      const w = point instanceof Vector4 ? point.w : undefined
      this.controlPoints[i] = new Vector4(point.x, point.y, z, w)
    }
  }

  getPoint(t: number, optionalTarget: Vector3) {
    const point = optionalTarget || new Vector3()

    const u = this.knots[this.startKnot] + t * (this.knots[this.endKnot] - this.knots[this.startKnot]) // linear mapping t->u

    // following results in (wx, wy, wz, w) homogeneous point
    const hpoint = NURBSUtils.calcBSplinePoint(this.degree, this.knots, this.controlPoints, u)

    if (hpoint.w != 1.0) {
      // project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
      hpoint.divideScalar(hpoint.w)
    }

    return point.set(hpoint.x, hpoint.y, hpoint.z)
  }

  getTangent(t: number, optionalTarget: Vector3) {
    const tangent = optionalTarget || new Vector3()

    const u = this.knots[0] + t * (this.knots[this.knots.length - 1] - this.knots[0])
    const ders = NURBSUtils.calcNURBSDerivatives(this.degree, this.knots, this.controlPoints, u, 1)
    tangent.copy(ders[1]).normalize()

    return tangent
  }
}

export { NURBSCurve }
